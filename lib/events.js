const EventEmitter = require("events")
const Verify = require('./verify.js')
const config = require('config')
const jobcoin = require('./jobcoin.js')

class MixerEvents extends EventEmitter {}
const emitter = new MixerEvents()

// ------------------------------------------------------------------------
// Event 'new'
// ------------------------------------------------------------------------
// A new mixer request has been reseived. Send the record for verification.
// Verificaton is done by the Verify class. It polls the jobcoin API
// periodically trying to find proof of the transaction
// ------------------------------------------------------------------------
emitter.on('new', (record) => {
  var verify = new Verify(record)
  verify.poll()
})

// ------------------------------------------------------------------------
// Event 'verified'
// ------------------------------------------------------------------------
// This event notifies about a transaction being verified. At this point we
// deduct the commission from the record.
// ------------------------------------------------------------------------
emitter.on('verified', (record) => {
  record.amount *= (1 - config.get('mixer.commission'))
})

// ------------------------------------------------------------------------
// Event 'process'
// ------------------------------------------------------------------------
// Process the amount partially, sending it to the next available toAddress
// ------------------------------------------------------------------------
emitter.on('process', (record) => {
  var amount = record.amount / record.toAddress.length
  var address = record.toAddress.shift()
  var unlock = () => record.mutex = false
  jobcoin.sendCoins(config.get('mixer.address'), address, amount, unlock, unlock)
})

// ------------------------------------------------------------------------
// Event 'process'
// ------------------------------------------------------------------------
// If any dangling balance is left in the record (and no toAddresses
// remaining), then we refund the remaining balance back to the fromAddress
// ------------------------------------------------------------------------
emitter.on('refund', (record) => {
  var unlock = () => record.mutex = false
  jobcoin.sendCoins(config.get('mixer.address'), record.fromAddress, record.amount, unlock, unlock)
})

module.exports = emitter;
