const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mixer = require('./lib/mixer.js')

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

app.listen(3000, () => console.log('Example app listening on port 3000!'))
