const serve = require("./libs/serve")
const express = require("express")
const bodyParser = require('body-parser');
const channel = require("./libs/channel");
const storage = require("./libs/store");
const serve = require("./libs/serve");

const SEED = 'QWERTY9';

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/register', (req, res, next) => {
  const didgests = req.body.digests;
  
  const remainderAddress = composeAddress();
  storage.get('channel_' + req.body.id, (err, state) => {
    if (!state) {
      res.json({'error': 'Channel already exists'});
      return;
    }
    state = new flash({
      'index': 0,
      'security': 2,
      'deposit': [0, 0, 0],
      'stakes': [1, 0, 0],
      'depth': 4,
      'remainderAddress': remainderAddress
    });
    channel.getSubseed(SEED, (err, seed) => {
      if (err) {
        res.send(500).end();
        return;
      }
      storage.set('channel_' + req.body.id, {
        'seed': seed, 
        'state': state
      }, (err, res) =>{
        if (err) {
          res.send(500).end();
        }
        else {
          //
          // TODO: respond to client and establish channel        
          //
        }
      });
    });

  });
});

app.post('/address', (req, res, next) => {
  const clientDigest = req.body.digest;
  const digest = channel.getNewDigest(req.body.id, (err, digest) => {
    if (err) {
      res.status(404).json({'error': 'Unknown channel'});
    }
    else {
      res.json({
        'address': channel.getNewAddress([clientDigest, digest])
      });
    }
  });
});

app.post('/purchase', (req, res, next) => {
  const bundles = req.body.bundles;
  const item = storage.get('item_' + req.body.item, () => {
    if (item) {
      channel.processTransfer(req.body.id, item, bundles, (err, valid) => {
        if (err) {
          res.status(404).json({'error': 'Unknown channel'});
        }
        else if(!valid) {
         res.status(403).json({'error': 'Invalid transfer'}); 
        }
        else {
          next();
        }
      });
    }
    else {
      res.status(404).json({'error': 'Item not found'});
    }
  });
});

app.use(serve);

app.listen(9000, function() {
  console.log("Listening on port 9000!")
})
