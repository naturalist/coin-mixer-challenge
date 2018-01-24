const jobcoin = require('./jobcoin.js')
const config = require('config')
const emitter = require('./events.js')

var wallet = [];
var index = 0;

function Mixer() {}

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

  wallet.push(record)
  emitter.emit('new', record)
}

Mixer.prototype.process = function() {
  if (index < wallet.length) {
    var record = wallet[index]
    if (record.mutex === false) {
      if (record.amount !== null) {
        record.mutex = true
        emitter.emit('process', record, index)  
      }
    }
    index++
  } else {
    index = 0
  }

  setTimeout(this.process.bind(this), config.get('mixer.timeout'))
}

module.exports = Mixer
