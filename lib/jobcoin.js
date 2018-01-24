
var http = require("http");
var querystring = require('querystring');

// Common options used for all requests
// ------------------------------------
var commonOpt = {
  host: 'jobcoin.gemini.com',
  port: 80,
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
}

// getJSON
// ----------------------------------
function getJSON(options, onResult, onError) {
    var req = http.request(options, function(res) {
        var output = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => output += chunk )
        res.on('end', () => { 
          var json;

          try { 
            json = JSON.parse(output);
          } catch (e) {
            onError && onError(res.statusCode, output)
            return
          }

          if (res.statusCode < 400) {
            onResult && onResult(res.statusCode, json)
          } else {
            onError && onError(res.statusCode, json)
          }
        });
    });

    req.on('error', onError)

    return req
};

// getAddressInfo
// ---------------------------------------
function getAddressInfo(address, onResult, onError) {
  var opts = Object.assign(commonOpt, { path: `/hazy/api/addresses/${address}` });
  var req = getJSON(opts, onResult, onError);
  req.end();
}

// getAllTransactions
// ---------------------------------------
function getAllTransactions(onResult, onError) {
  var opts = Object.assign(commonOpt, { path: '/hazy/api/transactions' });
  var req = getJSON(opts, onResult, onError);
  req.end();
}

// sendCoins
// ---------------------------------------
function sendCoins(fromAddress, toAddress, amount, onResult, onError) {
  var payload = querystring.stringify({
    fromAddress: fromAddress,
    toAddress: toAddress,
    amount: String(amount)
  });

  var opts = Object.assign(commonOpt, {
    method: 'POST',
    path: '/hazy/api/transactions',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
    }
  });

  var req = getJSON(opts, onResult, onError);
  req.write(payload);
  req.end();
}

// createAddress
// ---------------------------------------
function createAddress(address, onResult, onError) {
  var payload = querystring.stringify({ address: String(address) });

  var opts = Object.assign(commonOpt, {
    method: 'POST',
    path: '/hazy/create',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
    }
  });

  var req = getJSON(opts, onResult, onError);
  req.write(payload);
  req.end();
}

module.exports = {
  getAddressInfo: getAddressInfo,
  getAllTransactions: getAllTransactions,
  sendCoins: sendCoins,
  createAddress: createAddress
};
