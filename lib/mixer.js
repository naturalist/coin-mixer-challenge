const config = require('config')
const jobcoin = require('./jobcoin.js')
const Verify = require('./verify.js')

function Mixer() {
  // Make all variables public, so they can be seen and
  // modified by the tests
  this.wallet = [];
  this.index = 0;
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
    amount: null,
    mutex: false
  }

  // A new mixer request has been reseived. Send the record for verification.
  // Verificaton is done by the Verify class. It polls the jobcoin API
  // periodically trying to find proof of the transaction
  this.wallet.push(record)
  var verify = new Verify(record)
  verify.poll()
}

/**************************************************************
 * Method: _process(idx)
 * ------------------------------------------------------------
 *  Processes (mixes) the record with index idx
 *  Input:
 *    - idx: Number
 *
 *  Output:  
 *    - Boolean - if true, then index must be incremented
 **************************************************************/
Mixer.prototype._process = function(idx) {
  if (idx > this.wallet.length - 1)
    return true;

  var record = this.wallet[idx];
  var unlock = () => record.mutex = false

  // If the record does not have any toAddress values left, then we check if there
  // is any balance left. If no, then we remove the record, otherwise we
  // refund the remaining balance back to the fromAddress account
  if (record.toAddress.length === 0) {
    if (record.amount === 0) {
      this.wallet.splice(this.index, 1)
      return false;
    } else {
      // If any dangling balance is left in the record (and no toAddress values
      // remaining), then we refund the remaining balance back to the fromAddress
      record.mutex = true
      jobcoin.refund(record, ()=> { unlock(); record.amount = 0; }, unlock)
      return true
    }
  }

  // If the record is locked (i.e. the mutex is on), then we don't do
  // anything, otherwise we lock the mutex and send the record for processing
  if (!record.mutex) {
    if (record.amount !== null) {
      record.mutex = true
      var amount = record.amount / record.toAddress.length
      var address = record.toAddress.shift()
      jobcoin.pay(address, amount, ()=> { unlock(); record.amount -= amount; }, unlock)
    }
  }

  return true;
}

/**************************************************************
 * Method: process()
 * ------------------------------------------------------------
 *  Schedules a timer that runs _process with the next index
 **************************************************************/
Mixer.prototype.process = function() {
  if (this._process(this.index)) {
    if (this.index >= this.wallet.length)
      this.index = 0
    else
      this.index++
  }

  setTimeout(this.process.bind(this), config.get('mixer.timeout'))
}

module.exports = new Mixer()
