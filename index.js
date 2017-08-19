const express = require("express");
const bodyParser = require('body-parser');
const storage = require("./libs/storage");
const serve = require("./libs/serve");
const Flash = require("iota.flash.js");
const channel = require("./libs/channel");
var cors = require('cors')

const SEED = 'DDVZVZ9QJPUGMDAKGPTEUBOS9AWWVWF99MCKNIXALMKJRBGSQMXOVBRKHSJNOVMBZJRRRMVNXJCKPXPXJ';

const app = express();

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/register', (req, res, next) => { 
  console.log(req.body)
  
  storage.get('channel_' + req.body.id, (err, state) => {
    if (state) {
      res.json({'error': 'Channel already exists'});
      return;
    }
    channel.getSubseed(SEED, (err, seed) => {
      if (err) {
        res.send(500).json({'error': 'Internal server error'});
        return;
      }
      const digests = req.body.digests;

      flash = new Flash({
        'index': 0,
        'security': 2,
        'deposit': [0, 0, 0],
        'stakes': [1, 0, 0],
      });

      let myDigests = [];
      flash.state.remainderAddress = channel.finishMultisig(flash, digests.unshift(), myDigests, seed);
      let multisigs = digests.map(digest => channel.finishMultisig(flash, digest, myDigests));
      for(let i = 1; i < multisigs.length; i++) {
        multisigs[i-1].children.push(multisigs[i]);
      }
      flash.state.root = multisigs[0];
      storage.set('channel_' + req.body.id, {
        'seed': seed, 
        'state': flash
      }, (err, res) =>{
        if (err) {
          res.send(500).end();
        }
        else {
          //
          // TODO: respond to client and establish channel        
          //
          res.json({
            digests: myDigests,
          });
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
        'address': channel.getAddress([clientDigest, digest])
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
