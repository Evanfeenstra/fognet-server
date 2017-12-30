const express = require("express")
const bodyParser = require("body-parser")
const storage = require("./libs/storage")
const Flash = require("./libs/iota.flash.js")
const multisig = Flash.multisig
const channel = require("./libs/channel")
const cors = require("cors")
const crypto = require("crypto")
var Inliner = require('inliner')

const SEED =
  "DDVZVZ9QJPUGWDAKGPTEUBOS9AWWWWF99MCKNIXALMKJRBGSQWXOVWRKHSJNOVWBZJRRRWVNXJCKPXPXJ"

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/fognet', (req, res, next) => {
  console.log('/fognet ', req.body.url)

  new Inliner(req.body.url, (error, html) => {
    // compressed and inlined HTML page
    return res.json({
      html: html
    })
  });
  //storage.get("channel_" + req.body.id, (err, state) => {
})

app.post("/register", (req, res, next) => {
  console.log('/register ', req.body.id)
  storage.get("channel_" + req.body.id, (err, state) => {
    if (state) {
      return res.json({ error: "Channel already exists" })
    }
    channel.getSubseed(SEED, (err, seed) => {
      if (err) {
        return res.send(500).json({ error: "Internal server error" })
      }
      const digests = req.body.digests
      flash = {
        index: 0,
        security: 2,
        deposit: [400, 0],
        outputs: {},
        transfers: [],
        signersCount: 2
      }
      let myDigests = digests.map(() =>
        multisig.getDigest(seed, flash.index++, flash.security)
      )
      {
        // compose multisigs, write to remainderAddress and root
        let multisigs = digests.map((digest, i) => {
          let addy = multisig.composeAddress([digest, myDigests[i]])
          addy.index = myDigests[i].index
          addy.security = 2
          addy.signingIndex = 2
          addy.securitySum = 4
          return addy
        })
        flash.remainderAddress = multisigs.shift()
        for (let i = 1; i < multisigs.length; i++) {
          multisigs[i - 1].children.push(multisigs[i])
        }
        flash.root = multisigs.shift()
      }
      storage.set(
        "channel_" + req.body.id,
        {
          seed: seed,
          flash: flash
        },
        err => {
          if (err) {
            return res.send(500).end()
          }
          //
          // TODO: respond to client and establish channel
          //
          return res.json({
            digests: myDigests
          })
        }
      )
    })
  })
})

app.post("/branch", (req, res, next) => {
  console.log('/branch ', req.body.id)
  storage.get("channel_" + req.body.id, (err, state) => {
    if (!state) {
      return res.status(404).json({ error: "Channel not registered" })
    }
    const clientDigests = req.body.digests
    let myDigests = clientDigests.map(() =>
      multisig.getDigest(state.seed, state.flash.index++, state.flash.security)
    )
    {
      // compose multisigs, write to remainderAddress and root
      let multisigs = clientDigests.map((digest, i) => {
        let addy = multisig.composeAddress([digest, myDigests[i]])
        addy.index = myDigests[i].index
        addy.security = 2
        addy.signingIndex = 2
        addy.securitySum = 4
        return addy
      })
      for (let i = 1; i < multisigs.length; i++) {
        multisigs[i - 1].children.push(multisigs[i])
      }
      let node = state.flash.root
      while (node.address != req.body.address) {
        node = node.children[node.children.length - 1]
      }
      node.children.push(multisigs[0])
    }
    storage.set("channel_" + req.body.id, state, err => {
      if (err) {
        return res.send(500).end()
      }
      return res.json({
        digests: myDigests
      })
    })
  })
})

app.post("/address", (req, res, next) => {
  console.log('/address ', req.body.id)
  const clientDigest = req.body.digest
  const digest = channel.getNewDigest(req.body.id, (err, digest) => {
    if (err) {
      return res.status(404).json({ error: "Unknown channel" })
    }
    return res.json({
      address: channel.getAddress([clientDigest, digest])
    })
  })
})

app.post("/purchase", (req, res, next) => {
  const bundles = req.body.bundles
  console.log("Getting Item!")
  storage.get("item_" + req.body.item, (err, item) => {
    if (item) {
      channel.processTransfer(req.body.id, item, bundles, (err, signatures) => {
        if (err) {
          return res.status(404).json({ error: "Unknown channel" })
        }
        if (!signatures) {
          return res.status(403).json({ error: "Invalid transfer" })
        }
        const key = crypto.randomBytes(50).toString("hex")
        storage.set(item.id + "_" + key, 1, err => {
          if (err) {
            return res.status(500).json({ error: "Internal server error" })
          }
          return res.json({ id: item.id, key: key, bundles: signatures })
        })
      })
    } else {
      return res.status(404).json({ error: "Item not found" })
    }
  })
})

app.post("/close", (req, res, next) => {
  console.log('/close ', req.body.id)
  const bundles = req.body.bundles
  channel.processTransfer(
    req.body.id,
    { value: 0 },
    bundles,
    (err, signatures) => {
      if (err) {
        return res.status(404).json({ error: "Unknown channel" })
      }
      if (!signatures) {
        return res.status(403).json({ error: "Invalid transfer" })
      }

      storage.set(req.body.id + "_close", signatures, err => {
        if (err) {
          return res.status(500).json({ error: "Internal server error" })
        }
        return res.json({ bundles: signatures })
      })
    }
  )
})

app.post("/item", (req, res) => {
  console.log('/item ', req.body.id)
  /* if (req.get('Authorization') !== '') {
    res.status(403).end();
    return;
  }*/
  var item = {
    id: req.body.id,
    value: req.body.value
  }
  if (req.body.content) item.content = req.body.content
  storage.set("item_" + item.id, item, err => {
    if (err) {
      return res.status(500).end()
    }
    return res.json(item)
  })
})

app.get("/item/:item/:key", (req, res, next) => {
  storage.get(req.params.item + "_" + req.params.key, (err, exists) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" })
    }
    if (exists !== 1) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    storage.get("item_" + req.params.item, (err, data) => {
      if (err) {
        return res.status(500).end()
      }
      if (data.content) return res.json(data.content)

      var options = {
        root: __dirname + "/public"
      }
      // Respond with the file
      return res.sendFile(req.params.item, options, function(err) {
        // Throw if file doesn't exist
        if (err) {
          return res.status(403).json({ error: "File not found" })
        }
      })
    })
  })
})

app.listen(8081, function() {
  console.log("Listening on port 8081!!!")
})
