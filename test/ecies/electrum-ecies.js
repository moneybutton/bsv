'use strict'

var ECIES = require('../../lib/ecies/electrum-ecies')

var should = require('chai').should()
var bsv = require('../../')
var PrivateKey = bsv.PrivateKey

var aliceKey = new PrivateKey('L1Ejc5dAigm5XrM3mNptMEsNnHzS7s51YxU7J61ewGshZTKkbmzJ')
var bobKey = new PrivateKey('KxfxrUXSMjJQcb3JgnaaA6MqsrKQ1nBSxvhuigdKRyFiEm6BZDgG')

describe('ECIES', function () {
  it('constructor', function () {
    (typeof ECIES).should.equal('function')
  })

  it('constructs an instance', function () {
    var ecies = new ECIES();
    (ecies instanceof ECIES).should.equal(true)
  })

  it('doesnt require the "new" keyword', function () {
    var ecies = ECIES();
    (ecies instanceof ECIES).should.equal(true)
  })

  it('use ephemeral privateKey if privateKey is not set', function () {
    var ecies = ECIES()
    var ephemeralKey = ecies._privateKey;
    (ephemeralKey instanceof bsv.PrivateKey).should.equal(true)
  })

  it('chainable function', function () {
    var ecies = ECIES()
      .privateKey(aliceKey)
      .publicKey(bobKey.publicKey);

    (ecies instanceof ECIES).should.equal(true)
  })

  it('should do these test vectors correctly', function () {
    let message = Buffer.from('this is my test message')

    let alice = ECIES()
      .privateKey(aliceKey)
      .publicKey(bobKey.publicKey)
    alice.decrypt(Buffer.from('QklFMQOGFyMXLo9Qv047K3BYJhmnJgt58EC8skYP/R2QU/U0yXXHOt6L3tKmrXho6yj6phfoiMkBOhUldRPnEI4fSZXbiaH4FsxKIOOvzolIFVAS0FplUmib2HnlAM1yP/iiPsU=', 'base64')).toString().should.equal(message.toString())

    let bob = ECIES()
      .privateKey(bobKey)
      .publicKey(aliceKey.publicKey)
    bob.decrypt(Buffer.from('QklFMQM55QTWSSsILaluEejwOXlrBs1IVcEB4kkqbxDz4Fap53XHOt6L3tKmrXho6yj6phfoiMkBOhUldRPnEI4fSZXbvZJHgyAzxA6SoujduvJXv+A9ri3po9veilrmc8p6dwo=', 'base64')).toString().should.equal(message.toString())
  })

  var alice = ECIES()
    .privateKey(aliceKey)
    .publicKey(bobKey.publicKey)

  var bob = ECIES()
    .privateKey(bobKey)
    .publicKey(aliceKey.publicKey)

  var aliceReloaded = ECIES()
    .privateKey(aliceKey)
    .publicKey(bobKey.publicKey)

  var message = 'attack at dawn'
  var encrypted = 'QklFMQM55QTWSSsILaluEejwOXlrBs1IVcEB4kkqbxDz4Fap56+ajq0hzmnaQJXwUMZ/DUNgEx9i2TIhCA1mpBFIfxWZy+sH6H+sqqfX3sPHsGu0ug=='
  var encBuf = Buffer.from(encrypted, 'base64')

  it('correctly encrypts a message', function () {
    var ciphertext = alice.encrypt(message)
    Buffer.isBuffer(ciphertext).should.equal(true)
    ciphertext.toString('base64').should.equal(encrypted)
  })

  it('correctly decrypts a message', function () {
    var decrypted = bob
      .decrypt(encBuf)
      .toString()
    decrypted.should.equal(message)
  })

  it('correctly recovers a message', function () {
    var decrypted = aliceReloaded
      .decrypt(encBuf)
      .toString()
    decrypted.should.equal(message)
  })

  it('retrieves senders publickey from the encypted buffer', function () {
    var bob2 = ECIES().privateKey(bobKey)
    var decrypted = bob2.decrypt(encBuf).toString()
    bob2._publicKey.toDER().should.deep.equal(aliceKey.publicKey.toDER())
    decrypted.should.equal(message)
  })

  var message1 = 'This is message from first sender'
  var message2 = 'This is message from second sender'

  it('decrypt messages from different senders', function () {
    var sender1 = ECIES().publicKey(bobKey.publicKey)
    var sender2 = ECIES().publicKey(bobKey.publicKey)
    var bob2 = ECIES().privateKey(bobKey)
    var decrypted1 = bob2.decrypt(sender1.encrypt(message1)).toString()
    var decrypted2 = bob2.decrypt(sender2.encrypt(message2)).toString()
    decrypted1.should.equal(message1)
    decrypted2.should.equal(message2)
  })

  it('roundtrips', function () {
    var secret = 'some secret message!!!'
    var encrypted = alice.encrypt(secret)
    var decrypted = bob
      .decrypt(encrypted)
      .toString()
    decrypted.should.equal(secret)
  })

  it('roundtrips (no public key)', function () {
    alice.opts.noKey = true
    bob.opts.noKey = true
    var secret = 'some secret message!!!'
    var encrypted = alice.encrypt(secret)
    var decrypted = bob
      .decrypt(encrypted)
      .toString()
    decrypted.should.equal(secret)
  })

  it('roundtrips (short tag)', function () {
    alice.opts.shortTag = true
    bob.opts.shortTag = true
    var secret = 'some secret message!!!'
    var encrypted = alice.encrypt(secret)
    var decrypted = bob
      .decrypt(encrypted)
      .toString()
    decrypted.should.equal(secret)
  })

  it('roundtrips (no public key & short tag)', function () {
    alice.opts.noKey = true
    alice.opts.shortTag = true
    bob.opts.noKey = true
    bob.opts.shortTag = true
    var secret = 'some secret message!!!'
    var encrypted = alice.encrypt(secret)
    var decrypted = bob
      .decrypt(encrypted)
      .toString()
    decrypted.should.equal(secret)
  })

  it('errors', function () {
    should.exist(bsv.errors.ECIES)
  })

  it('correctly fails if trying to decrypt a bad message', function () {
    var encrypted = Buffer.from(encBuf)
    encrypted[encrypted.length - 1] = 2;
    (function () {
      return bob.decrypt(encrypted)
    }).should.throw('Invalid checksum')
  })

  it('decrypting uncompressed keys', function () {
    var secret = 'test'

    // test uncompressed
    var alicePrivateKey = bsv.PrivateKey.fromObject({
      bn: '1fa76f9c799ca3a51e2c7c901d3ba8e24f6d870beccf8df56faf30120b38f360',
      compressed: false,
      network: 'livenet'
    })
    var alicePublicKey = bsv.PublicKey.fromPrivateKey(alicePrivateKey) // alicePrivateKey.publicKey
    alicePrivateKey.compressed.should.equal(false)

    var cypher1 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey)
    var encrypted = cypher1.encrypt(secret)

    var cypher2 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey)
    var decrypted = cypher2.decrypt(encrypted)
    secret.should.equal(decrypted.toString())
  })

  it('decrypting compressed keys', function () {
    var secret = 'test'

    // test compressed
    var alicePrivateKey = bsv.PrivateKey.fromObject({
      bn: '1fa76f9c799ca3a51e2c7c901d3ba8e24f6d870beccf8df56faf30120b38f360',
      compressed: true,
      network: 'livenet'
    })
    var alicePublicKey = bsv.PublicKey.fromPrivateKey(alicePrivateKey) // alicePrivateKey.publicKey
    alicePrivateKey.compressed.should.equal(true)

    var cypher1 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey)
    var encrypted = cypher1.encrypt(secret)

    var cypher2 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey)
    var decrypted = cypher2.decrypt(encrypted)
    secret.should.equal(decrypted.toString())
  })
})
