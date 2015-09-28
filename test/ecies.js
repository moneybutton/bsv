/* global describe,it */
'use strict'
let ECIES = require('../lib/ecies')
let should = require('chai').should()
let Keypair = require('../lib/keypair')
let Hash = require('../lib/hash')

describe('#ECIES', function () {
  it('should make a new ECIES object', function () {
    let ecies = new ECIES()
    should.exist(ecies)
  })

  it('should make a new ECIES object when called without "new"', function () {
    let ecies = ECIES()
    should.exist(ecies)
  })

  let fromkey = Keypair().fromRandom()
  let tokey = Keypair().fromRandom()
  let messagebuf = Hash.sha256(new Buffer('my message is the hash of this string'))

  describe('@encrypt', function () {
    it('should return a buffer', function () {
      let encbuf = ECIES.encrypt(messagebuf, tokey.pubkey, fromkey)
      Buffer.isBuffer(encbuf).should.equal(true)
    })

    it('should return a buffer if fromkey is not present', function () {
      let encbuf = ECIES.encrypt(messagebuf, tokey.pubkey)
      Buffer.isBuffer(encbuf).should.equal(true)
    })
  })

  describe('@decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let encbuf = ECIES.encrypt(messagebuf, tokey.pubkey, fromkey)
      let messagebuf2 = ECIES.decrypt(encbuf, tokey.privkey)
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'))
    })

    it('should decrypt that which was encrypted if fromkeypair was randomly generated', function () {
      let encbuf = ECIES.encrypt(messagebuf, tokey.pubkey)
      let messagebuf2 = ECIES.decrypt(encbuf, tokey.privkey)
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'))
    })
  })
})
