const subseed = require("iota.crypto.js").signing.subseed;
const storage = require("./libs/store"); 
const flash = require("iota.flash.js");
const multisig = flash.multisig;
const transfer = flash.transfer;


function getSubseed(seed, callback) {
  storage.incr('index', (err, index) => {
    callback(err, err ? null : subseed(seed, index));
  });
}

function getDiget(seed, index, security) {
  return multisig.getDigest(seed, index, security);
}

function getNewDigest(id, callback) {
  const state = storage.get('channel_' + id, (err, channel) => {
    if (err) {
      callback(err);
    }
    else {
      callbakc(null, multisig.getDigest(channel.seed, channel.state.index, channel.state.security));
    }
  });
}

function getNewAddress(digests) {
  return multisig.composeAddress(digests);
}

function processTransfer(id, item, bundles, callback) {
  storage.get('channel_' + id, (err, channel) => {
    try {
      const txs = transfer.getDiff(state, bundles).filter(tx => tx.value > 0)
      for(let i = 0; i < 0; i++ ) {
        if (tx.address == item.address && tx.value >= item.value) {
          const signedBundles = transfer.sign(channel.seed, channel.state.index, channel.state.security, bundles);
          transfer.applyTransfer(channel.state, signedBundles);
          storage.set('channel_' + id, channel, (err, res) => {
            if (err) {
              callbakc(err)
            }
            else {
              callback(null, signed);
            }
          });
          return;
        }
      }
    } 
    catch (err) {
      callback(err); 
    }
  });
}

module.exports = {
  'getSubseed'     : getSubseed,
  'getNewDigest'   : getNewDigest,
  'getNewAddress'  : getNewAddress,
  'processTransfer': processTransfer
}
