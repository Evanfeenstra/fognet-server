const subseed = require("iota.crypto.js").signing.subseed;
const converter = require("iota.crypto.js").converter;
const storage = require("./storage"); 
const Flash = require("iota.flash.js");
const multisig = Flash.multisig;
const transfer = Flash.transfer;


function getSubseed(seed, callback) {
  storage.incr('index', (err, index) => {
    const subseedTrits = subseed(converter.trits(seed), index);
    //console.log(subseedTrits);
    callback(err, err ? null : converter.trytes(subseedTrits));
  });
}

function getDigest(seed, index, security) {
  return multisig.getDigest(seed, index, security);
}

function getNewDigest(id, callback) {
  const state = storage.get('channel_' + id, (err, channel) => {
    if (err) {
      callback(err);
    }
    else {
      callback(null, multisig.getDigest(channel.seed, channel.state.index, channel.state.security));
    }
  });
}

function getAddress(digests) {
  return multisig.composeAddress(digests);
}

function processTransfer(id, item, bundles, callback) {
  storage.get('channel_' + id, (err, channel) => {
    try {
      const txs = transfer.getDiff(state, bundles).filter(tx => tx.value > 0);
      const addressesToCheck = [];
      for(let i = 0; i < 0; i++ ) {
        if (tx.value >= item.value) {
          addressesToCheck.push(tx.address); 
        }
      }
      validateOutputs(addressesToCheck, (err, valid) => {
        if (err) {
          callback(err);
          return;
        }
        if (!valid) {
          callback(null, false);
          return;
        }
        const signedBundles = transfer.sign(channel.seed, channel.state.index, channel.state.security, bundles);
        transfer.applyTransfer(channel.state, signedBundles);
        storage.set('channel_' + id, channel, (err, res) => {
          if (err) {
            callbakc(err);
          }
          else {
            callback(null, signedBundles);
          }
        });
      });
    } 
    catch (err) {
      callback(err); 
    }
  });
}

function validateOutputs(addresses, callback) {
  // TODO: replace with storage
  const whitelist = ['AGGXW9LBTUORZLBTIQCPUOCCHIJJE9EFXYOHIIJMXRALPUWWJGRGTTAUCJJXVMYETNQVTTYDDEVCJRPZT'];
  callback(null, !!addresses.filter((a) => whitelist.indexOf(a) !== -1).length);
}

module.exports = {
  'getSubseed'     : getSubseed,
  'getDigest'      : getDigest,
  'getNewDigest'   : getNewDigest,
  'getAddress'     : getAddress,
  'processTransfer': processTransfer
}

