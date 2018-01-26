const jobcoin = require('./jobcoin.js')
const config = require('config')

function Verify(record) {
  this.record = record
  this.tries = 0;
}

/**************************************************************
 * Method: onSuccess(code, data)
 * ------------------------------------------------------------
 *  Handles the response from the jobcoin API for the specified 
 *  address.
 *
 *  Input:
 *    - code: Number
 *    - data: Object
 **************************************************************/
Verify.prototype.onSuccess = function(code, data) {
  
  // Iterate all transactions for this address and find the one that was sent
  // to the Mixer, *and* has a timestamp greater than the record, i.e. it
  // occurred after the record was created
  for (var i = data.transactions.length - 1; i > 0; i--) {
    var txn = data.transactions[i]
    txn.timestamp = new Date(txn.timestamp)


    if (txn.toAddress === config.get('mixer.address')) {
      if (txn.timestamp >= this.record.timestamp) {
        // This event notifies about a transaction being verified. At this point we
        // deduct the commission from the record.
        this.record.timestamp = txn.timestamp
        this.record.amount = txn.amount
        this.record.amount *= (1 - config.get('mixer.commission'))
        if (config.get('debug'))
          console.log('Verified', this.record)
        break
      }
    }
  }

  // If the transaction was found, record.amount will be set to a non-null
  // value. This is our cue that the record got validated.
  // If amount is null, then we keep polling the API for a little while
  // longer and finally we give up.
  if (this.record.amount === null) {
    if (this.tries++ < config.get('verify.tries')) {
      setTimeout(this.poll.bind(this), config.get('verify.timeout'))
    } else {
      // Remove record by deleting the toAddress and letting mixer.process handle the rest
      this.record.toAddress = []
    }
  }
}

function onError(code, data) {
  console.log(`VERIFY ERROR: ${code}`, data)
}

/**************************************************************
 * Method: poll()
 * ------------------------------------------------------------
 * Polls the jobcoin API for changes in the transactions for the
 * specified address
 **************************************************************/
Verify.prototype.poll = function() {
  if (config.get('debug'))
    console.log('Verify poll:', this.record.fromAddress)
  jobcoin.getAddressInfo(this.record.fromAddress, this.onSuccess.bind(this), onError.bind(this))
}

module.exports = Verify;
