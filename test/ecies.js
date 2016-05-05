/* global describe,it */
'use strict'
let Ecies = require('../lib/ecies')
let should = require('chai').should()
let KeyPair = require('../lib/key-pair')
let Hash = require('../lib/hash')

describe('#Ecies', function () {
  it('should make a new Ecies object', function () {
    should.exist(Ecies)
  })

  let fromkey = new KeyPair().fromRandom()
  let tokey = new KeyPair().fromRandom()
  let messageBuf = Hash.sha256(new Buffer('my message is the hash of this string'))

  describe('@encrypt', function () {
    it('should return a buffer', function () {
      let encBuf = Ecies.encrypt(messageBuf, tokey.pubKey, fromkey)
      Buffer.isBuffer(encBuf).should.equal(true)
    })

    it('should return a buffer if fromkey is not present', function () {
      let encBuf = Ecies.encrypt(messageBuf, tokey.pubKey)
      Buffer.isBuffer(encBuf).should.equal(true)
    })
  })

  describe('@decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let encBuf = Ecies.encrypt(messageBuf, tokey.pubKey, fromkey)
      let messageBuf2 = Ecies.decrypt(encBuf, tokey.privKey)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })

    it('should decrypt that which was encrypted if fromkeyPair was randomly generated', function () {
      let encBuf = Ecies.encrypt(messageBuf, tokey.pubKey)
      let messageBuf2 = Ecies.decrypt(encBuf, tokey.privKey)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })
})
