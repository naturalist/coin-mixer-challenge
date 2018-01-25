const jobcoin = require('./jobcoin.js')
const config = require('config')
const emitter = require('./events.js')

function Mixer() {
  this.wallet = [];
  this.index = 0;
}

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

  this.wallet.push(record)
  emitter.emit('new', record)
}

Mixer.prototype._process = function(idx) {
  if (idx > this.wallet.length - 1)
    return true;

  var record = this.wallet[idx];

  // If the record does not have any toAddresses left, then we check if there
  // is any balance left. If no, then we remove the record, otherwise we
  // refund the remaining balance back to the fromAddress account
  if (record.toAddress.length === 0) {
    if (record.amount === 0) {
      this.wallet.splice(this.index, 1)
      return false;
    } else {
      record.mutex = true
      emitter.emit('refund', record)
      return true
    }
  }

  // If the record is locked (i.e. the mutex is on), then we don't do
  // anything, otherwise we lock the mutex and send the record for processing
  if (!record.mutex) {
    if (record.amount !== null) {
      record.mutex = true
      emitter.emit('process', record)  
    }
  }

  return true;
}

Mixer.prototype.process = function() {
  if (this._process.bind(this)(this.index)) {
    if (this.index >= this.wallet.length)
      this.index = 0
    else
      this.index++
  }

  setTimeout(this.process.bind(this), config.get('mixer.timeout'))
}

module.exports = new Mixer()
