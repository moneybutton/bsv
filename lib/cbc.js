/**
 * Cbc (experimental)
 * ==================
 *
 * Cipher Block Chaining (Cbc). This is a low-level tool for chaining multiple
 * encrypted blocks together, usually with Aes. This is a low-level tool that
 * does not include authentication. You should only be using this if you have
 * authentication at another step. It is best combined with Hmac.
 *
 * http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher-block_chaining_.28Cbc.29
 */
'use strict'
let dependencies = {
  cmp: require('./cmp')
}

let inject = function (deps) {
  let cmp = deps.cmp

  let Cbc = {}

  Cbc.buf2blockbufs = function (buf, blocksize) {
    let bytesize = blocksize / 8
    let blockbufs = []

    for (let i = 0; i <= buf.length / bytesize; i++) {
      let blockbuf = buf.slice(i * bytesize, i * bytesize + bytesize)

      if (blockbuf.length < blocksize) {
        blockbuf = Cbc.pkcs7pad(blockbuf, blocksize)
      }

      blockbufs.push(blockbuf)
    }

    return blockbufs
  }

  Cbc.blockbufs2buf = function (blockbufs) {
    let last = blockbufs[blockbufs.length - 1]
    last = Cbc.pkcs7unpad(last)
    blockbufs[blockbufs.length - 1] = last

    let buf = Buffer.concat(blockbufs)

    return buf
  }

  Cbc.encrypt = function (messageBuf, ivBuf, blockcipher, cipherKeyBuf) {
    let blocksize = ivBuf.length * 8
    let blockbufs = Cbc.buf2blockbufs(messageBuf, blocksize)
    let encBufs = Cbc.encryptblocks(blockbufs, ivBuf, blockcipher, cipherKeyBuf)
    let encBuf = Buffer.concat(encBufs)
    return encBuf
  }

  Cbc.decrypt = function (encBuf, ivBuf, blockcipher, cipherKeyBuf) {
    let bytesize = ivBuf.length
    let encBufs = []
    for (let i = 0; i < encBuf.length / bytesize; i++) {
      encBufs.push(encBuf.slice(i * bytesize, i * bytesize + bytesize))
    }
    let blockbufs = Cbc.decryptblocks(encBufs, ivBuf, blockcipher, cipherKeyBuf)
    let buf = Cbc.blockbufs2buf(blockbufs)
    return buf
  }

  Cbc.encryptblock = function (blockbuf, ivBuf, blockcipher, cipherKeyBuf) {
    let xorbuf = Cbc.xorbufs(blockbuf, ivBuf)
    let encBuf = blockcipher.encrypt(xorbuf, cipherKeyBuf)
    return encBuf
  }

  Cbc.decryptblock = function (encBuf, ivBuf, blockcipher, cipherKeyBuf) {
    let xorbuf = blockcipher.decrypt(encBuf, cipherKeyBuf)
    let blockbuf = Cbc.xorbufs(xorbuf, ivBuf)
    return blockbuf
  }

  Cbc.encryptblocks = function (blockbufs, ivBuf, blockcipher, cipherKeyBuf) {
    let encBufs = []

    for (let i = 0; i < blockbufs.length; i++) {
      let blockbuf = blockbufs[i]
      let encBuf = Cbc.encryptblock(blockbuf, ivBuf, blockcipher, cipherKeyBuf)

      encBufs.push(encBuf)

      ivBuf = encBuf
    }

    return encBufs
  }

  Cbc.decryptblocks = function (encBufs, ivBuf, blockcipher, cipherKeyBuf) {
    let blockbufs = []

    for (let i = 0; i < encBufs.length; i++) {
      let encBuf = encBufs[i]
      let blockbuf = Cbc.decryptblock(encBuf, ivBuf, blockcipher, cipherKeyBuf)

      blockbufs.push(blockbuf)

      ivBuf = encBuf
    }

    return blockbufs
  }

  Cbc.pkcs7pad = function (buf, blocksize) {
    let bytesize = blocksize / 8
    let padbytesize = bytesize - buf.length
    let pad = new Buffer(padbytesize)
    pad.fill(padbytesize)
    let paddedbuf = Buffer.concat([buf, pad])
    return paddedbuf
  }

  Cbc.pkcs7unpad = function (paddedbuf) {
    let padlength = paddedbuf[paddedbuf.length - 1]
    let padbuf = paddedbuf.slice(paddedbuf.length - padlength, paddedbuf.length)
    let padbuf2 = new Buffer(padlength)
    padbuf2.fill(padlength)
    if (!cmp(padbuf, padbuf2)) {
      throw new Error('invalid padding')
    }
    return paddedbuf.slice(0, paddedbuf.length - padlength)
  }

  Cbc.xorbufs = function (buf1, buf2) {
    if (buf1.length !== buf2.length) {
      throw new Error('bufs must have the same length')
    }

    let buf = new Buffer(buf1.length)

    for (let i = 0; i < buf1.length; i++) {
      buf[i] = buf1[i] ^ buf2[i]
    }

    return buf
  }

  return Cbc
}

inject = require('injecter')(inject, dependencies)
let Cbc = inject()
module.exports = Cbc
