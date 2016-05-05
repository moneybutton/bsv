/* global describe,it */
'use strict'
let Aes = require('../lib/aes')
require('chai').should()
let Cbc = require('../lib/cbc')

describe('Cbc', function () {
  describe('@buf2blockbufs', function () {
    it('should convert this buffer into one block', function () {
      let buf = new Buffer(16 - 1)
      buf.fill(0)
      let blockbufs = Cbc.buf2blockbufs(buf, 16 * 8)
      blockbufs.length.should.equal(1)
      blockbufs[0].toString('hex').should.equal('00000000000000000000000000000001')
    })

    it('should convert this buffer into two blocks', function () {
      let buf = new Buffer(16)
      buf.fill(0)
      let blockbufs = Cbc.buf2blockbufs(buf, 16 * 8)
      blockbufs.length.should.equal(2)
      blockbufs[0].toString('hex').should.equal('00000000000000000000000000000000')
      blockbufs[1].toString('hex').should.equal('10101010101010101010101010101010')
    })
  })

  describe('@buf2blockbufs', function () {
    it('should convert this buffer into one block and back into the same buffer', function () {
      let buf = new Buffer(16 - 1)
      buf.fill(0)
      let blockbufs = Cbc.buf2blockbufs(buf, 16 * 8)
      let buf2 = Cbc.blockbufs2buf(blockbufs)
      buf2.toString('hex').should.equal(buf.toString('hex'))
    })

    it('should convert this buffer into two blocks and back into the same buffer', function () {
      let buf = new Buffer(16)
      buf.fill(0)
      let blockbufs = Cbc.buf2blockbufs(buf, 16 * 8)
      let buf2 = Cbc.blockbufs2buf(blockbufs)
      buf2.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('@encrypt', function () {
    it('should return this known value', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(128 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })

    it('should return this shorter known value', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(120 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })

    it('should return this shorter known value', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(136 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })

    it('should encrypt something with Aes', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(128 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = Aes
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })
  })

  describe('@decrypt', function () {
    it('should properly decrypt an encrypted message', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(128 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      messageBuf2 = Cbc.decrypt(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })

    it('should properly decrypt an encrypted message', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(120 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      messageBuf2 = Cbc.decrypt(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('@encryptblock', function () {
    it('should return this known value', function () {
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let enc = Cbc.encryptblock(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      enc.toString('hex').should.equal(ivBuf.toString('hex'))
    })

    it('should return this other known value', function () {
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0x10)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let enc = Cbc.encryptblock(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      enc.toString('hex').should.equal('00000000000000000000000000000000')
    })
  })

  describe('@decryptblock', function () {
    it('should decrypt an encrypted block', function () {
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encryptblock(messageBuf, ivBuf, blockcipher, cipherKeyBuf)
      let buf = Cbc.decryptblock(encBuf, ivBuf, blockcipher, cipherKeyBuf)
      buf.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('@encryptblocks', function () {
    it('should return this known value', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(128 / 8)
      messageBuf2.fill(0x10)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBufs = Cbc.encryptblocks([messageBuf1, messageBuf2], ivBuf, blockcipher, cipherKeyBuf)
      encBufs[0].toString('hex').should.equal('10101010101010101010101010101010')
      encBufs[1].toString('hex').should.equal('00000000000000000000000000000000')
    })
  })

  describe('@decryptblocks', function () {
    it('should decrypt encrypted blocks', function () {
      let messageBuf1 = new Buffer(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = new Buffer(128 / 8)
      messageBuf2.fill(0x10)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = new Buffer(128 / 8)
      cipherKeyBuf.fill(0)
      let blockcipher = {}
      blockcipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockcipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBufs = Cbc.encryptblocks([messageBuf1, messageBuf2], ivBuf, blockcipher, cipherKeyBuf)
      let bufs = Cbc.decryptblocks(encBufs, ivBuf, blockcipher, cipherKeyBuf)
      bufs[0].toString('hex').should.equal(messageBuf1.toString('hex'))
      bufs[1].toString('hex').should.equal(messageBuf2.toString('hex'))
    })
  })

  describe('@pkcs7pad', function () {
    it('should pad this 32 bit buffer to 128 bits with the number 128/8 - 32/8', function () {
      let buf = new Buffer(32 / 8)
      buf.fill(0)
      let padbuf = Cbc.pkcs7pad(buf, 128)
      padbuf.length.should.equal(128 / 8)
      padbuf[32 / 8].should.equal(128 / 8 - 32 / 8)
      padbuf[32 / 8 + 1].should.equal(128 / 8 - 32 / 8)
      // ...
      padbuf[32 / 8 + 128 / 8 - 32 / 8 - 1].should.equal(128 / 8 - 32 / 8)
    })
  })

  describe('@pkcs7unpad', function () {
    it('should unpad this padded 32 bit buffer', function () {
      let buf = new Buffer(32 / 8)
      buf.fill(0)
      let paddedbuf = Cbc.pkcs7pad(buf, 128)
      let unpaddedbuf = Cbc.pkcs7unpad(paddedbuf, 128)
      unpaddedbuf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('@xorbufs', function () {
    it('should xor 1 and 0', function () {
      let buf1 = new Buffer([1])
      let buf2 = new Buffer([0])
      let buf = Cbc.xorbufs(buf1, buf2)
      buf[0].should.equal(1)
    })

    it('should xor 1 and 1', function () {
      let buf1 = new Buffer([1])
      let buf2 = new Buffer([1])
      let buf = Cbc.xorbufs(buf1, buf2)
      buf[0].should.equal(0)
    })
  })
})
