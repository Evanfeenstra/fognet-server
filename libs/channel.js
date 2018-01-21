const add = require("iota.crypto.js").add
const converter = require("iota.crypto.js").converter
const storage = require("./storage")
const multisig = require("./iota.flash.js").multisig
const transfer = require("./iota.flash.js").transfer

function getSubseed(seed, callback) {
  storage.incr("index", (err, index) => {
    const subseedTrits = subseed(converter.trits(seed), index)
    //console.log(subseedTrits);
    callback(err, err ? null : converter.trytes(subseedTrits))
  })
}

function subseed(seed, index) {
  var indexTrits = converter.fromValue( index );
  return add( seed.slice( ), indexTrits );
}

function getDigest(seed, index, security) {
  return multisig.getDigest(seed, index, security)
}

function getNewDigest(id, callback) {
  const state = storage.get("channel_" + id, (err, channel) => {
    if (err) {
      callback(err)
    } else {
      callback(
        null,
        multisig.getDigest(
          channel.seed,
          channel.flash.index,
          channel.flash.security
        )
      )
    }
  })
}

function getAddress(digests) {
  return multisig.composeAddress(digests)
}

function processTransfer(id, bundles, callback) {
  storage.get("channel_" + id, (err, channel) => {
    if (err) {
      callback(err)
      return
    }
    try {
      const flashState = channel.flash
      const signatures = transfer.sign(
        flashState.root,
        channel.seed,
        bundles
      )

      let signedBundles = transfer.appliedSignatures(bundles, signatures)

      transfer.applyTransfers(
        flashState.root,
        flashState.deposit,
        flashState.outputs,
        flashState.remainderAddress,
        flashState.transfers,
        signedBundles
      )
      storage.set("channel_" + id, channel, (err, res) => {
        if (err) {
          callback(err)
        } else {
          callback(null, signedBundles)
        }
      })
      //     })
    } catch (err) {
      console.log(err)
      callback(null, false)
    }
  })
}

function validateOutputs(addresses, callback) {
  // TODO: replace with storage
  const whitelist = [
    "TRPSU9DSNROHLCPIXBXGDXPOLKPUOYZZBZJCEILRJNSIFZASLPKHCIDIDBRCJHASMENZMTICJMBZRANKM",
    "AGGXW9LBTUORZLBTIQCPUOCCHIJJE9EFXYOHIIJMXRALPUWWJGRGTTAUCJJXVMYETNQVTTYDDEVCJRPZT"
  ]
  // callback(null, !!addresses.filter((a) => whitelist.indexOf(a) !== -1).length);
  callback(null, true)
}

module.exports = {
  getSubseed: getSubseed,
  getDigest: getDigest,
  getNewDigest: getNewDigest,
  getAddress: getAddress,
  processTransfer: processTransfer
}
