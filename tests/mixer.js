
const sinon = require('sinon')
const expect = require('chai').expect
const mixer = require('../lib/mixer.js')
const jobcoin = require('../lib/jobcoin.js')
const config = require('config')

describe('Mixer', ()=> {
  
  var refund, pay

  before(()=> {
    refund = sinon.stub(jobcoin, "refund").callsFake((rec, onSuccess, onError) => { onSuccess() })
    pay = sinon.stub(jobcoin, "pay").callsFake((address, amount, onSuccess, onCancel)=> { onSuccess() })
  })

  after(()=> {
    refund.restore()
    pay.restore()
  })

  describe('iterator edge cases', ()=> {
    var iterator

    before(()=> {
      mixer.wallet = [ 
        { fromAddress: 'aa', toAddress: [], amount: 0 },
        { fromAddress: 'aa', toAddress: [], amount: 4 }
      ]
      iterator = mixer.makeIterator()
    })

    it('cleans records with no recepients and no amount', (done)=> {
      iterator(() => {
        expect(mixer.wallet).to.have.lengthOf(1)
        expect(pay.calledOnce).to.be.false
        expect(refund.calledOnce).to.be.false
        done()
      })
    })

    it('refunds and cleans records with no recepients, with amount', (done)=> {
      iterator(() => {
        expect(mixer.wallet).to.have.lengthOf(0)
        expect(pay.calledOnce).to.be.false
        expect(refund.calledOnce).to.be.true
        done()
      })
    })
  
  })

  describe('iterator mixed cases', ()=> {
    var iterator

    before(()=> {
      mixer.wallet = [ 
        { fromAddress: 'A0', toAddress: ['A1', 'A2'], amount: 2 },
        { fromAddress: 'B0', toAddress: [], amount: 3 },
      ]
      iterator = mixer.makeIterator()
    })

    it('first run', (done)=> {
      iterator(() => {
        expect(mixer.wallet).to.have.lengthOf(2)
        expect(mixer.wallet[0].toAddress).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress[0]).to.equal('A2')
        expect(mixer.wallet[0].amount).to.equal(1)
        done()
      })
    })

    it('second run', (done)=> {
      iterator(() => {
        expect(mixer.wallet).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress[0]).to.equal('A2')
        expect(mixer.wallet[0].amount).to.equal(1)
        done()
      })
    })
    
  })

  describe('iterator normal run', ()=> {

    var iterator

    before(()=> {
      mixer.wallet = [ 
        { fromAddress: 'A0', toAddress: ['A1', 'A2'], amount: 2 },
        { fromAddress: 'B0', toAddress: ['B1', 'B2', 'B3'], amount: 3 },
      ]
      iterator = mixer.makeIterator()
    })

    it('first run', (done)=> {
      iterator(() => {
        expect(mixer.wallet).to.have.lengthOf(2)
        expect(mixer.wallet[0].toAddress).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress[0]).to.equal('A2')
        expect(mixer.wallet[0].amount).to.equal(1)
        done()
      })
    })

    it('second run', (done)=> {
      iterator(()=> {
        expect(mixer.wallet).to.have.lengthOf(2)
        expect(mixer.wallet[1].toAddress).to.have.lengthOf(2)
        expect(mixer.wallet[1].toAddress[0]).to.equal('B2')
        expect(mixer.wallet[1].amount).to.equal(2)
        done()
      })
    })

    it('third run', (done)=> {
      iterator(()=> {
        expect(mixer.wallet).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress).to.have.lengthOf(2)
        expect(mixer.wallet[0].toAddress[0]).to.equal('B2')
        expect(mixer.wallet[0].amount).to.equal(2)
        done()
      })
    })

    it('fourth run', (done)=> {
      iterator(()=> {
        expect(mixer.wallet).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress).to.have.lengthOf(1)
        expect(mixer.wallet[0].toAddress[0]).to.equal('B3')
        expect(mixer.wallet[0].amount).to.equal(1)
        done()
      })
    })

    it('fifth run', (done)=> {
      iterator(()=> {
        expect(mixer.wallet).to.have.lengthOf(0)
        done()
      })
    })

    it('sixth run', (done)=> {
      iterator(()=> {
        expect(mixer.wallet).to.have.lengthOf(0)
        done()
      })
    })

  })
})
