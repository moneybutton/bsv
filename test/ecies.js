/* global describe,it */
'use strict'
import { Ecies } from '../lib/ecies'
import should from 'should'
import { KeyPair } from '../lib/key-pair'
import { PrivKey } from '../lib/priv-key'
import { Hash } from '../lib/hash'

describe('#Ecies', function () {
  it('should make a new Ecies object', function () {
    should.exist(Ecies)
  })

  const fromkey = new KeyPair().fromRandom()
  const tokey = new KeyPair().fromRandom()
  const messageBuf = Hash.sha256(
    Buffer.from('my message is the hash of this string')
  )

  describe('@bitcoreEncrypt', function () {
    it('should return a buffer', function () {
      const encBuf = Ecies.bitcoreEncrypt(messageBuf, tokey.pubKey, fromkey)
      Buffer.isBuffer(encBuf).should.equal(true)
    })

    it('should return a buffer if fromkey is not present', function () {
      const encBuf = Ecies.bitcoreEncrypt(messageBuf, tokey.pubKey)
      Buffer.isBuffer(encBuf).should.equal(true)
    })
  })

  describe('@asyncBitcoreEncrypt', function () {
    it('should return a buffer', async function () {
      const encBuf = await Ecies.asyncBitcoreEncrypt(messageBuf, tokey.pubKey, fromkey)
      Buffer.isBuffer(encBuf).should.equal(true)
    })

    it('should return a buffer if fromkey is not present', async function () {
      const encBuf = await Ecies.asyncBitcoreEncrypt(messageBuf, tokey.pubKey)
      Buffer.isBuffer(encBuf).should.equal(true)
    })
  })

  describe('@bitcoreDecrypt', function () {
    it('should decrypt that which was encrypted', function () {
      const encBuf = Ecies.bitcoreEncrypt(messageBuf, tokey.pubKey, fromkey)
      const messageBuf2 = Ecies.bitcoreDecrypt(encBuf, tokey.privKey)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })

    it('should decrypt that which was encrypted if fromKeyPair was randomly generated', function () {
      const encBuf = Ecies.bitcoreEncrypt(messageBuf, tokey.pubKey)
      const messageBuf2 = Ecies.bitcoreDecrypt(encBuf, tokey.privKey)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('@asyncDecrypt', function () {
    it('should decrypt that which was encrypted', async function () {
      const encBuf = await Ecies.asyncBitcoreEncrypt(messageBuf, tokey.pubKey, fromkey)
      const messageBuf2 = await Ecies.asyncBitcoreDecrypt(encBuf, tokey.privKey)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })

    it('should decrypt that which was encrypted if fromKeyPair was randomly generated', async function () {
      const encBuf = await Ecies.asyncBitcoreEncrypt(messageBuf, tokey.pubKey)
      const messageBuf2 = await Ecies.asyncBitcoreDecrypt(encBuf, tokey.privKey)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('Electrum Ecies', function () {
    const alicePrivKey = PrivKey.fromString('L1Ejc5dAigm5XrM3mNptMEsNnHzS7s51YxU7J61ewGshZTKkbmzJ')
    const aliceKeyPair = KeyPair.fromPrivKey(alicePrivKey)
    const bobPrivKey = PrivKey.fromString('KxfxrUXSMjJQcb3JgnaaA6MqsrKQ1nBSxvhuigdKRyFiEm6BZDgG')
    const bobKeyPair = KeyPair.fromPrivKey(bobPrivKey)

    it('should do these test vectors correctly', function () {
      const message = Buffer.from('this is my test message')

      Ecies.electrumDecrypt(Buffer.from('QklFMQOGFyMXLo9Qv047K3BYJhmnJgt58EC8skYP/R2QU/U0yXXHOt6L3tKmrXho6yj6phfoiMkBOhUldRPnEI4fSZXbiaH4FsxKIOOvzolIFVAS0FplUmib2HnlAM1yP/iiPsU=', 'base64'), alicePrivKey).toString().should.equal(message.toString())
      Ecies.electrumDecrypt(Buffer.from('QklFMQM55QTWSSsILaluEejwOXlrBs1IVcEB4kkqbxDz4Fap53XHOt6L3tKmrXho6yj6phfoiMkBOhUldRPnEI4fSZXbvZJHgyAzxA6SoujduvJXv+A9ri3po9veilrmc8p6dwo=', 'base64'), bobPrivKey).toString().should.equal(message.toString())

      Ecies.electrumEncrypt(message, bobKeyPair.pubKey, aliceKeyPair).toString('base64').should.equal('QklFMQM55QTWSSsILaluEejwOXlrBs1IVcEB4kkqbxDz4Fap53XHOt6L3tKmrXho6yj6phfoiMkBOhUldRPnEI4fSZXbvZJHgyAzxA6SoujduvJXv+A9ri3po9veilrmc8p6dwo=')
      Ecies.electrumEncrypt(message, aliceKeyPair.pubKey, bobKeyPair).toString('base64').should.equal('QklFMQOGFyMXLo9Qv047K3BYJhmnJgt58EC8skYP/R2QU/U0yXXHOt6L3tKmrXho6yj6phfoiMkBOhUldRPnEI4fSZXbiaH4FsxKIOOvzolIFVAS0FplUmib2HnlAM1yP/iiPsU=')
    })

    it('should encrypt and decrypt symmetrically with matching strings in ECDH noKey mode', function () {
      const message = Buffer.from('this is my ECDH test message')
      const ecdhMessageEncryptedBob = Ecies.electrumEncrypt(message, bobKeyPair.pubKey, aliceKeyPair, true)
      const ecdhMessageEncryptedAlice = Ecies.electrumEncrypt(message, aliceKeyPair.pubKey, bobKeyPair, true)
      ecdhMessageEncryptedBob.toString("base64").should.equal(ecdhMessageEncryptedAlice.toString("base64"))
      Ecies.electrumDecrypt(ecdhMessageEncryptedAlice, bobPrivKey, aliceKeyPair.pubKey).toString().should.equal('this is my ECDH test message')
      Ecies.electrumDecrypt(ecdhMessageEncryptedBob, alicePrivKey, bobKeyPair.pubKey).toString().should.equal('this is my ECDH test message')
    })
    /*
    const message = 'attack at dawn'
    const encrypted = 'QklFMQM55QTWSSsILaluEejwOXlrBs1IVcEB4kkqbxDz4Fap56+ajq0hzmnaQJXwUMZ/DUNgEx9i2TIhCA1mpBFIfxWZy+sH6H+sqqfX3sPHsGu0ug=='
    const encBuf = Buffer.from(encrypted, 'base64')

    it('correctly encrypts a message', function () {
      const ciphertext = alice.encrypt(message)
      Buffer.isBuffer(ciphertext).should.equal(true)
      ciphertext.toString('base64').should.equal(encrypted)
    })

    it('correctly decrypts a message', function () {
      const decrypted = bob
        .decrypt(encBuf)
        .toString()
      decrypted.should.equal(message)
    })

    it('correctly recovers a message', function () {
      const decrypted = aliceReloaded
        .decrypt(encBuf)
        .toString()
      decrypted.should.equal(message)
    })

    it('retrieves senders PubKey from the encypted buffer', function () {
      const bob2 = Ecies().PrivKey(bobPrivKey)
      const decrypted = bob2.decrypt(encBuf).toString()
      bob2._PubKey.toDER().should.deep.equal(alicePrivKey.PubKey.toDER())
      decrypted.should.equal(message)
    })

    const message1 = 'This is message from first sender'
    const message2 = 'This is message from second sender'

    it('decrypt messages from different senders', function () {
      const sender1 = Ecies().PubKey(bobPrivKey.PubKey)
      const sender2 = Ecies().PubKey(bobPrivKey.PubKey)
      const bob2 = Ecies().PrivKey(bobPrivKey)
      const decrypted1 = bob2.decrypt(sender1.encrypt(message1)).toString()
      const decrypted2 = bob2.decrypt(sender2.encrypt(message2)).toString()
      decrypted1.should.equal(message1)
      decrypted2.should.equal(message2)
    })

    it('roundtrips', function () {
      const secret = 'some secret message!!!'
      const encrypted = alice.encrypt(secret)
      const decrypted = bob
        .decrypt(encrypted)
        .toString()
      decrypted.should.equal(secret)
    })

    it('roundtrips (no public key)', function () {
      alice.opts.noKey = true
      bob.opts.noKey = true
      const secret = 'some secret message!!!'
      const encrypted = alice.encrypt(secret)
      const decrypted = bob
        .decrypt(encrypted)
        .toString()
      decrypted.should.equal(secret)
    })

    it('roundtrips (short tag)', function () {
      alice.opts.shortTag = true
      bob.opts.shortTag = true
      const secret = 'some secret message!!!'
      const encrypted = alice.encrypt(secret)
      const decrypted = bob
        .decrypt(encrypted)
        .toString()
      decrypted.should.equal(secret)
    })

    it('roundtrips (no public key & short tag)', function () {
      alice.opts.noKey = true
      alice.opts.shortTag = true
      bob.opts.noKey = true
      bob.opts.shortTag = true
      const secret = 'some secret message!!!'
      const encrypted = alice.encrypt(secret)
      const decrypted = bob
        .decrypt(encrypted)
        .toString()
      decrypted.should.equal(secret)
    })

    it('errors', function () {
      should.exist(bsv.errors.Ecies)
    })

    it('correctly fails if trying to decrypt a bad message', function () {
      const encrypted = Buffer.from(encBuf)
      encrypted[encrypted.length - 1] = 2
      ;(function () {
        return bob.decrypt(encrypted)
      }).should.throw('Invalid checksum')
    })

    it('decrypting uncompressed keys', function () {
      const secret = 'test'

      // test uncompressed
      const alicePrivKey = bsv.PrivKey.fromObject({
        bn: '1fa76f9c799ca3a51e2c7c901d3ba8e24f6d870beccf8df56faf30120b38f360',
        compressed: false,
        network: 'livenet'
      })
      const alicePubKey = bsv.PubKey.fromPrivKey(alicePrivKey) // alicePrivKey.PubKey
      alicePrivKey.compressed.should.equal(false)

      const cypher1 = Ecies().PrivKey(alicePrivKey).PubKey(alicePubKey)
      const encrypted = cypher1.encrypt(secret)

      const cypher2 = Ecies().PrivKey(alicePrivKey).PubKey(alicePubKey)
      const decrypted = cypher2.decrypt(encrypted)
      secret.should.equal(decrypted.toString())
    })

    it('decrypting compressed keys', function () {
      const secret = 'test'

      // test compressed
      const alicePrivKey = bsv.PrivKey.fromObject({
        bn: '1fa76f9c799ca3a51e2c7c901d3ba8e24f6d870beccf8df56faf30120b38f360',
        compressed: true,
        network: 'livenet'
      })
      const alicePubKey = bsv.PubKey.fromPrivKey(alicePrivKey) // alicePrivKey.PubKey
      alicePrivKey.compressed.should.equal(true)

      const cypher1 = Ecies().PrivKey(alicePrivKey).PubKey(alicePubKey)
      const encrypted = cypher1.encrypt(secret)

      const cypher2 = Ecies().PrivKey(alicePrivKey).PubKey(alicePubKey)
      const decrypted = cypher2.decrypt(encrypted)
      secret.should.equal(decrypted.toString())
    })
    */
  })
})
