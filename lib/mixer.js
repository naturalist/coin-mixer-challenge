const config = require('config')
const jobcoin = require('./jobcoin.js')
const Verify = require('./verify.js')

function Mixer() {
  // Make all variables public, so they can be seen and
  // modified by the tests
  this.wallet = [];
  this.idx = 0;
}

/**************************************************************
 * Method: add(params)
 * ------------------------------------------------------------
 *  Adds a new record to the wallet.
 *  Input `params`:
 *    - fromAddress: String
 *    - toAddress: [String | Array]
 **************************************************************/
Mixer.prototype.add = function(params) {
  var toAddress = Array.isArray(params.toAddress)
    ? params.toAddress
    : [ params.toAddress ]

  // Create a uniform record for each mixer request
  var record = {
    fromAddress: params.fromAddress,
    toAddress: toAddress,
    timestamp: new Date(),
    amount: null
  }

  // A new mixer request has been reseived. Send the record for verification.
  // Verificaton is done by the Verify class. It polls the jobcoin API
  // periodically trying to find proof of the transaction
  this.wallet.push(record)
  var verify = new Verify(record)
  verify.poll()
}

/**************************************************************
 * Method: makeIterator()
 * ------------------------------------------------------------
 * Creates an iterator to be used to process the next coin batch
 **************************************************************/
Mixer.prototype.makeIterator = function() {
  var idx = this.idx;
  var wallet = this.wallet;

  return function(callback) {
    if (config.get('debug'))
      console.log('Iterator:', idx, wallet)

    if (wallet.length === 0) {
      callback()
      return
    }

    if (idx >= wallet.length) {
      idx = 0
    }

    var record = wallet[idx]
    var increment = function() {
      idx = idx < wallet.length - 1 ? idx + 1 : 0
      callback()
    }

    // If the record does not have any toAddress values left, then we check if there
    // is any balance left. If not, then we remove the record, otherwise we
    // refund the remaining balance back to the fromAddress account
    if (record.toAddress.length === 0) {

      // If the amount is also 0, then we remove the record from the wallet
      if (record.amount === 0) {
        wallet.splice(idx, 1)
        callback();
      } 
      
      // However, if there is still any amount left (unlikely), then we refund
      // it back to the sender
      else {
        wallet.splice(idx, 1)
        jobcoin.refund(record, callback, callback)
      }

      return
    }

    if (record.amount !== null) {
      var amount    = record.amount / record.toAddress.length,
          address   = record.toAddress.shift()

      if (record.toAddress.length === 0) {
        wallet.splice(idx, 1)
        jobcoin.pay(address, amount, callback, callback)
      }
      else {
        var onSuccess = ()=> { record.amount -= amount; increment() }
        jobcoin.pay(address, amount, onSuccess, increment)
      }
    }
    else {
      increment()
    }
  }
}

module.exports = new Mixer()
