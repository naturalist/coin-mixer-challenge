
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

// getJSON
// ----------------------------------
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
            onError(res.statusCode, output)
            return
          }

          if (res.statusCode < 400) {
            onResult(res.statusCode, json)
          } else {
            onError(res.statusCode, json)
          }
        })
    })

    req.on('error', onError)

    return req
}

// getAddressInfo
// ---------------------------------------
function getAddressInfo(address, onResult, onError) {
  var opts = Object.assign(commonOpt, { path: `/hazy/api/addresses/${address}` })
  var req = getJSON(opts, onResult, onError)
  req.end()
}

// sendCoins
// ---------------------------------------
function sendCoins(fromAddress, toAddress, amount, onResult, onError) {
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

  var req = getJSON(opts, onResult, onError)
  req.write(payload)
  req.end()
}

module.exports = {
  getAddressInfo: getAddressInfo,
  sendCoins: sendCoins
}
