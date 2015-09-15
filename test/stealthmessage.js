'use strict'
let Keypair = require('../lib/keypair')
let StealthMessage = require('../lib/stealthmessage')
let StealthKey = require('../lib/stealthkey')
let StealthAddress = require('../lib/stealthaddress')
let KDF = require('../lib/kdf')
let Hash = require('../lib/hash')
let should = require('chai').should()
let Address = require('../lib/address')

describe('StealthMessage', function () {
  let payloadKeypair = KDF.buf2keypair(new Buffer('key1'))
  let scanKeypair = KDF.buf2keypair(new Buffer('key2'))
  let fromKeypair = KDF.buf2keypair(new Buffer('key3'))
  let enchex = 'f557994f16d0d628fa4fdb4ab3d7e0bc5f2754f20381c7831a20c7c9ec88dcf092ea3683261798ccda991ed65a3a54a036d8125dec0381c7831a20c7c9ec88dcf092ea3683261798ccda991ed65a3a54a036d8125dec9f86d081884c7d659a2feaa0c55ad01560ba2904d3bc8395b6c4a6f87648edb33db6a22170e5e26f340c7ba943169210234cd6a753ad13919b0ab7d678b47b5e7d63e452382de2c2590fb57ef048f7b3'
  let encbuf = new Buffer(enchex, 'hex')
  let ivbuf = Hash.sha256(new Buffer('test')).slice(0, 128 / 8)
  let sk = StealthKey().fromObject({payloadKeypair: payloadKeypair, scanKeypair: scanKeypair})
  let sa = StealthAddress().fromStealthKey(sk)
  let messagebuf = new Buffer('this is my message')

  it('should make a new stealthmessage', function () {
    let sm = new StealthMessage()
    should.exist(sm)
    sm = StealthMessage()
    should.exist(sm)
  })

  it('should allow "set" style syntax', function () {
    let encbuf = StealthMessage().fromObject({
      messagebuf: messagebuf,
      toStealthAddress: sa
    }).encrypt().encbuf
    should.exist(encbuf)
    encbuf.length.should.equal(113)
  })

  describe('#fromObject', function () {
    it('should set the messagebuf', function () {
      let sm = StealthMessage().fromObject({messagebuf: messagebuf})
      should.exist(sm.messagebuf)
    })

  })

  describe('@encrypt', function () {
    it('should encrypt a message', function () {
      let encbuf = StealthMessage.encrypt(messagebuf, sa)
      encbuf.length.should.equal(166)
    })

    it('should encrypt a message with this fromKeypair and ivbuf the same each time', function () {
      let encbuf = StealthMessage.encrypt(messagebuf, sa, fromKeypair, ivbuf)
      encbuf.length.should.equal(166)
      encbuf.toString('hex').should.equal(enchex)
    })

  })

  describe('@decrypt', function () {
    it('should decrypt this known message correctly', function () {
      let messagebuf2 = StealthMessage.decrypt(encbuf, sk)
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'))
    })

  })

  describe('@isForMe', function () {
    it('should know that this message is for me', function () {
      StealthMessage.isForMe(encbuf, sk).should.equal(true)
    })

    it('should know that this message is for me even if my payloadPrivkey is not present', function () {
      let sk2 = new StealthKey()
      sk2.scanKeypair = sk.scanKeypair
      sk2.payloadKeypair = Keypair().fromObject({pubkey: sk.payloadKeypair.pubkey})
      should.not.exist(sk2.payloadKeypair.privkey)
      StealthMessage.isForMe(encbuf, sk2).should.equal(true)
    })

  })

  describe('#encrypt', function () {
    it('should encrypt this message', function () {
      let sm = StealthMessage().fromObject({
        messagebuf: messagebuf,
        toStealthAddress: sa,
        fromKeypair: fromKeypair
      })
      sm.encrypt().encbuf.length.should.equal(113)
    })

  })

  describe('#decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let sm = StealthMessage().fromObject({
        messagebuf: messagebuf,
        toStealthAddress: sa
      }).encrypt()
      let messagebuf2 = StealthMessage().fromObject({
        encbuf: sm.encbuf,
        fromKeypair: sm.fromKeypair,
        toStealthKey: sk
      }).decrypt().messagebuf
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'))
    })

  })

  describe('#isForMe', function () {
    it('should know that this message is for me', function () {
      StealthMessage().fromObject({
        encbuf: encbuf,
        toStealthKey: sk,
        fromKeypair: fromKeypair,
        receiveAddress: Address().fromObject({hashbuf: encbuf.slice(0, 20)})
      }).isForMe().should.equal(true)
    })

    it('should know that this message is not for me', function () {
      StealthMessage().fromObject({
        encbuf: encbuf,
        toStealthKey: sk,
        fromKeypair: fromKeypair,
        receiveAddress: Address().fromObject({hashbuf: encbuf.slice(0, 20)})
      }).isForMe().should.equal(true)
    })

  })

})
