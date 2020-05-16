/* global describe,it */
'use strict'
import { Aes } from '../lib/aes'
import { Cbc } from '../lib/cbc'
require('should')

describe('Cbc', function () {
  describe('@buf2BlocksBuf', function () {
    it('should convert this buffer into one block', function () {
      let buf = Buffer.alloc(16 - 1)
      buf.fill(0)
      let blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
      blockBufs.length.should.equal(1)
      blockBufs[0]
        .toString('hex')
        .should.equal('00000000000000000000000000000001')
    })

    it('should convert this buffer into two blocks', function () {
      let buf = Buffer.alloc(16)
      buf.fill(0)
      let blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
      blockBufs.length.should.equal(2)
      blockBufs[0]
        .toString('hex')
        .should.equal('00000000000000000000000000000000')
      blockBufs[1]
        .toString('hex')
        .should.equal('10101010101010101010101010101010')
    })
  })

  describe('@buf2BlocksBuf', function () {
    it('should convert this buffer into one block and back into the same buffer', function () {
      let buf = Buffer.alloc(16 - 1)
      buf.fill(0)
      let blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
      let buf2 = Cbc.blockBufs2Buf(blockBufs)
      buf2.toString('hex').should.equal(buf.toString('hex'))
    })

    it('should convert this buffer into two blocks and back into the same buffer', function () {
      let buf = Buffer.alloc(16)
      buf.fill(0)
      let blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
      let buf2 = Cbc.blockBufs2Buf(blockBufs)
      buf2.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('@encrypt', function () {
    it('should return this known value', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(128 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })

    it('should return this shorter known value', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(120 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })

    it('should return this shorter known value', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(136 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })

    it('should encrypt something with Aes', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(128 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = Aes
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      let buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      Buffer.compare(messageBuf, buf2).should.equal(0)
    })
  })

  describe('@decrypt', function () {
    it('should properly decrypt an encrypted message', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(128 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      messageBuf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })

    it('should properly decrypt an encrypted message', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(120 / 8)
      messageBuf2.fill(0x10)
      let messageBuf = Buffer.concat([messageBuf1, messageBuf2])
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      messageBuf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('@encryptBlock', function () {
    it('should return this known value', function () {
      let messageBuf = Buffer.alloc(128 / 8)
      messageBuf.fill(0)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let enc = Cbc.encryptBlock(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      enc.toString('hex').should.equal(ivBuf.toString('hex'))
    })

    it('should return this other known value', function () {
      let messageBuf = Buffer.alloc(128 / 8)
      messageBuf.fill(0x10)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let enc = Cbc.encryptBlock(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
      enc.toString('hex').should.equal('00000000000000000000000000000000')
    })
  })

  describe('@decryptBlock', function () {
    it('should decrypt an encrypted block', function () {
      let messageBuf = Buffer.alloc(128 / 8)
      messageBuf.fill(0)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBuf = Cbc.encryptBlock(
        messageBuf,
        ivBuf,
        blockCipher,
        cipherKeyBuf
      )
      let buf = Cbc.decryptBlock(encBuf, ivBuf, blockCipher, cipherKeyBuf)
      buf.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('@encryptBlocks', function () {
    it('should return this known value', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(128 / 8)
      messageBuf2.fill(0x10)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBufs = Cbc.encryptBlocks(
        [messageBuf1, messageBuf2],
        ivBuf,
        blockCipher,
        cipherKeyBuf
      )
      encBufs[0]
        .toString('hex')
        .should.equal('10101010101010101010101010101010')
      encBufs[1]
        .toString('hex')
        .should.equal('00000000000000000000000000000000')
    })
  })

  describe('@decryptBlocks', function () {
    it('should decrypt encrypted blocks', function () {
      let messageBuf1 = Buffer.alloc(128 / 8)
      messageBuf1.fill(0)
      let messageBuf2 = Buffer.alloc(128 / 8)
      messageBuf2.fill(0x10)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0x10)
      let cipherKeyBuf = Buffer.alloc(128 / 8)
      cipherKeyBuf.fill(0)
      let blockCipher = {}
      blockCipher.encrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      blockCipher.decrypt = function (messageBuf, cipherKeyBuf) {
        return messageBuf
      }
      let encBufs = Cbc.encryptBlocks(
        [messageBuf1, messageBuf2],
        ivBuf,
        blockCipher,
        cipherKeyBuf
      )
      let bufs = Cbc.decryptBlocks(encBufs, ivBuf, blockCipher, cipherKeyBuf)
      bufs[0].toString('hex').should.equal(messageBuf1.toString('hex'))
      bufs[1].toString('hex').should.equal(messageBuf2.toString('hex'))
    })
  })

  describe('@pkcs7Pad', function () {
    it('should pad this 32 bit buffer to 128 bits with the number 128/8 - 32/8', function () {
      let buf = Buffer.alloc(32 / 8)
      buf.fill(0)
      let padbuf = Cbc.pkcs7Pad(buf, 128)
      padbuf.length.should.equal(128 / 8)
      padbuf[32 / 8].should.equal(128 / 8 - 32 / 8)
      padbuf[32 / 8 + 1].should.equal(128 / 8 - 32 / 8)
      // ...
      padbuf[32 / 8 + 128 / 8 - 32 / 8 - 1].should.equal(128 / 8 - 32 / 8)
    })
  })

  describe('@pkcs7Unpad', function () {
    it('should unpad this padded 32 bit buffer', function () {
      let buf = Buffer.alloc(32 / 8)
      buf.fill(0)
      let paddedbuf = Cbc.pkcs7Pad(buf, 128)
      let unpaddedbuf = Cbc.pkcs7Unpad(paddedbuf, 128)
      unpaddedbuf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('@xorBufs', function () {
    it('should xor 1 and 0', function () {
      let buf1 = Buffer.from([1])
      let buf2 = Buffer.from([0])
      let buf = Cbc.xorBufs(buf1, buf2)
      buf[0].should.equal(1)
    })

    it('should xor 1 and 1', function () {
      let buf1 = Buffer.from([1])
      let buf2 = Buffer.from([1])
      let buf = Cbc.xorBufs(buf1, buf2)
      buf[0].should.equal(0)
    })
  })
})
