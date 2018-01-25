
const jobcoin = require('../lib/jobcoin')
const sinon = require('sinon')
const chai = require('chai')
const expect = chai.expect


describe('getAddressInfo', ()=> {
  var code, json;

  before((done)=> {
    var ok = (c, j)=> {
      code = c
      json = j
      done()
    }

    jobcoin.getAddressInfo('Alice', ok) 
  })

  it('returns 200', ()=> expect(code).to.equal(200))
  it('returns balance', ()=> expect(json).to.have.property('balance'))
  it('returns transactions', ()=> expect(json).to.have.property('transactions'))
})

describe('sendCoins', ()=> {
  var code, json

  before((done)=> {
    jobcoin.sendCoins('Alice', 'Bob', 0.01, (c, j) => {
      code = c
      json = j
      done()
    })
  })

  it('returns 200', ()=> expect(code).to.equal(200))
})
