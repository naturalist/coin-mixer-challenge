const config = require('config')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const emitter = require('./lib/events.js')
const Mixer = require('./lib/mixer.js')
const Verify = require('./lib/verify.js')

const tools = {
  config: config,
  emitter: emitter
}

const mixer = new Mixer(tools)

// All params will be JSON
app.use(bodyParser.json())
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
})

app.post('/new', (req, res) => {
  if (!req.body.fromAddress) {
    res.status(400).send({error: "Invalid fromAddress"})
  }
  else if (!req.body.toAddress) {
    res.status(400).send({error: "Invalid toAddress"})
  }
  else {
    var idx = mixer.add(req.body)
    res.send({success: true})
  }
})

emitter.on('new', (record) => {
  var verify = new Verify(record)
  verify.poll()
})

// Take commission after a record gets verified
emitter.on('verified', (record) => {
  record.amount *= (1 - config.get('mixer.commission'))
})

emitter.on('process', (record, idx) => {
  var amount, toAddress;

  // If balance remaining but no addresses left, then send coins back to user
  if (record.toAddress.length === 0) {
    amount = record.amount;
    toAddress = record.fromAddress;
  }
  else {
    amount = rec.balance / rec.outputs.length;
    toAddress = rec.outputs.shift();
  }

  // XXX
  //jobcoin.sendCoins(mixerAddr, toAddress, amount);
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
