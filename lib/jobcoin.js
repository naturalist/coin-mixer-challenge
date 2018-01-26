
const http = require("http")
const querystring = require('querystring')
const config = require('config')

// Common options used for all requests
// ------------------------------------
var commonOpt = {
  host: config.get('jobcoin.host'),
  port: config.get('jobcoin.port'),
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
}

function JobCoin() {
}

/**************************************************************
 * Function: getJSON(params)
 * ------------------------------------------------------------
 *  Makes an AJAX call to jobcoin's API
 *  Input:
 *    - options: Object
 *    - onResult: Function(code, data)
 *    - onError: Function(code, data)
 **************************************************************/
function getJSON(options, onResult, onError) {
    if (!onResult) onResult = ()=> {}
    if (!onError) onError = ()=> {}

    var req = http.request(options, function(res) {
        var output = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => output += chunk )
        res.on('end', () => { 
          var json

          try { 
            json = JSON.parse(output)
          } catch (e) {
            if (config.get('debug'))
              console.log('Error:', options)
            onError(res.statusCode, output)
            return
          }

          if (res.statusCode < 400) {
            onResult(res.statusCode, json)
          } else {
            if (config.get('debug'))
              console.log('Error:', options)
            onError(res.statusCode, json)
          }
        })
    })

    req.on('error', onError)

    return req
}

/**************************************************************
 * Method: getAddressInfo(address, onResult, onError)
 * ------------------------------------------------------------
 *  Makes an AJAX call to retrieve transaction info for `address`
 *  Input:
 *    - address: String
 *    - onResult: Function(code, data)
 *    - onError: Function(code, data)
 **************************************************************/
JobCoin.prototype.getAddressInfo = function(address, onResult, onError) {
  var opts = Object.assign(commonOpt, { path: `/hazy/api/addresses/${address}` })
  var req = getJSON(opts, onResult, onError)
  req.end()
}

/**************************************************************
 * Method: send(fromAddress, toAddress, amount, onResult, onError)
 * ------------------------------------------------------------
 *  Makes an AJAX call to transfer coins from one address to another 
 *  Input:
 *    - fromAddress: String
 *    - toAddress: String
 *    - amount: Number
 *    - onResult: Function(code, data)
 *    - onError: Function(code, data)
 **************************************************************/
JobCoin.prototype.send = function(fromAddress, toAddress, amount, onResult, onError) {
  var payload = querystring.stringify({
    fromAddress: fromAddress,
    toAddress: toAddress,
    amount: String(amount)
  })

  var opts = Object.assign(commonOpt, {
    method: 'POST',
    path: '/hazy/api/transactions',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
    }
  })

  if (config.get('debug'))
    console.log('send', opts, payload)

  var req = getJSON(opts, onResult, onError)
  req.write(payload)
  req.end()
}

/**************************************************************
 * Method: refund(record, onResult, onError)
 * ------------------------------------------------------------
 *  Makes an AJAX call to refund coins from Mixer to the sender
 *  in the record
 *
 *  Input:
 *    - record: Object
 *    - onResult: Function(code, data)
 *    - onError: Function(code, data)
 **************************************************************/
JobCoin.prototype.refund = function(record, onResult, onError) {
  var success = function(code, data) {
    record.amount = 0
    onResult(code, data)
  }

  var error = function(code, data) {
    console.log('ERROR REFUNDING', record, code, data)
    onError(code, data)
  }

  this.send(config.get('mixer.address'), record.fromAddress, record.amount, success, error)
}

/**************************************************************
 * Method: pay(address, amount, onResult, onError)
 * ------------------------------------------------------------
 *  Makes an AJAX call to pay coins from Mixer to the address
 *
 *  Input:
 *    - address: String
 *    - amount: Number
 *    - onResult: Function(code, data)
 *    - onError: Function(code, data)
 **************************************************************/
JobCoin.prototype.pay = function(address, amount, onResult, onError) {
  var error = function(code, data) {
    console.log('ERROR PAYING', address, amount, code, data)
    onError(code, data)
  }
  this.send(config.get('mixer.address'), address, amount, onResult, error)
}

module.exports = new JobCoin()
