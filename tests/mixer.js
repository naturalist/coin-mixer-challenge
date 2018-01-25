
const sinon = require('sinon')
const chai = require('chai')
const expect = chai.expect
const mixer = require('../lib/mixer.js')
const jobcoin = require('../lib/jobcoin.js')
const config = require('config')

describe('Mixer', ()=> {
  
  var server

  describe('add', ()=> {
    it('turns toAddress into array', ()=> {
      mixer.add({fromAddress: 'aa', toAddress: 'bb'})
      expect(mixer.wallet[0]).to.have.property('toAddress').with.lengthOf(1)
    })
  })

  describe('_process', ()=> {
    
    var stub

    before(()=> stub = sinon.stub(jobcoin, "sendCoins"))
    after( ()=> stub.restore())

    beforeEach(()=> {
      mixer.wallet = [ 
        { fromAddress: 'aa', toAddress: [], amount: 0 },
        { fromAddress: 'aa', toAddress: [], amount: 4 },
        { fromAddress: 'aa', toAddress: ['bb', 'cc'], amount: 4 },
        { fromAddress: 'xx', toAddress: ['yy', 'zz'], amount: 10 },
      ]
    })
    
    it('removes records with no toAddress and no amount', ()=> {
      mixer._process(0)
      expect(mixer.wallet).to.have.lengthOf(3)
    })

    it('sends dangling balance back to sender', ()=> {
      mixer._process(1)
      expect(mixer.wallet).to.have.lengthOf(4)
      expect(stub.calledWith(config.get('mixer.address'), 'aa', 4)).to.be.true
    })

    it('processes unblocked records', ()=> {
      expect(mixer.wallet[2]).to.have.property('toAddress').with.length(2)
      mixer._process(2)
      expect(stub.calledWith(config.get('mixer.address'), 'bb', 2)).to.be.true
      expect(mixer.wallet[2]).to.have.property('toAddress').with.length(1)
    })

  })
})
