const config = require('config')
const jobcoin = require('./jobcoin.js')
const emitter = require('./events.js')

const tries = config.get('verify.tries')
const timeout = config.get('verify.timeout')

function Verify(record) {
  this.record = record
}

Verify.prototype.onSuccess = function(code, data) {

  // Iterate all transactions for this address and find the one that was sent
  // to the Mixer, *and* has a timestamp greater than the record, i.e. it
  // occurred after the record was created
  for (var i = data.transactions.length - 1; i > 0; i--) {
    var txn = data.transactions[i]
    txn.timestamp = new Date(txn.timestamp)

    if (txn.toAddress === config.get('mixer.address')) {
      // XXX
      //if (txn.timestamp >= this.record.timestamp) {
        this.record.amount = txn.amount
        emitter.emit('verified', this.record)
        break
      //}
    }
  }

  // If the transaction was found, record.amount will be set to a non-null
  // value. This is our cue that the record got validated.
  // If amount is null, then we keep polling the API for a little while
  // longer and finally we give up.
  if (this.record.amount === null) {
    if (this.tries++ < tries) {
      setTimeout(this.poll.bind(this), timeout)
    } else {
      // TODO: remove record
    }
  }
}

function onError(code, data) {
  console.log(`ERROR: ${code}`, data)
}

Verify.prototype.poll = function() {
  jobcoin.getAddressInfo(this.record.fromAddress, this.onSuccess.bind(this), onError.bind(this))
}

module.exports = Verify;
