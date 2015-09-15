/**
 * CBC (experimental)
 * ==================
 *
 * Cipher Block Chaining (CBC). This is a low-level tool for chaining multiple
 * encrypted blocks together, usually with AES. This is a low-level tool that
 * does not include authentication. You should only be using this if you have
 * authentication at another step. It is best combined with HMAC.
 *
 * http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher-block_chaining_.28CBC.29
 */
'use strict'
let dependencies = {
  cmp: require('./cmp'),
  Random: require('./random')
}

function inject (deps) {
  let cmp = deps.cmp
  let Random = deps.Random

  let CBC = {}

  CBC.buf2blockbufs = function (buf, blocksize) {
    let bytesize = blocksize / 8
    let blockbufs = []

    for (let i = 0; i <= buf.length / bytesize; i++) {
      let blockbuf = buf.slice(i * bytesize, i * bytesize + bytesize)

      if (blockbuf.length < blocksize)
        blockbuf = CBC.pkcs7pad(blockbuf, blocksize)

      blockbufs.push(blockbuf)
    }

    return blockbufs
  }

  CBC.blockbufs2buf = function (blockbufs, blocksize) {
    let bytesize = blocksize / 8

    let last = blockbufs[blockbufs.length - 1]
    last = CBC.pkcs7unpad(last)
    blockbufs[blockbufs.length - 1] = last

    let buf = Buffer.concat(blockbufs)

    return buf
  }

  CBC.encrypt = function (messagebuf, ivbuf, blockcipher, cipherkeybuf) {
    let blocksize = ivbuf.length * 8
    let blockbufs = CBC.buf2blockbufs(messagebuf, blocksize)
    let encbufs = CBC.encryptblocks(blockbufs, ivbuf, blockcipher, cipherkeybuf)
    let encbuf = Buffer.concat(encbufs)
    return encbuf
  }

  CBC.decrypt = function (encbuf, ivbuf, blockcipher, cipherkeybuf) {
    let blocksize = ivbuf.length * 8
    let bytesize = ivbuf.length
    let encbufs = []
    for (let i = 0; i < encbuf.length / bytesize; i++) {
      encbufs.push(encbuf.slice(i * bytesize, i * bytesize + bytesize))
    }
    let blockbufs = CBC.decryptblocks(encbufs, ivbuf, blockcipher, cipherkeybuf)
    let buf = CBC.blockbufs2buf(blockbufs, blocksize)
    return buf
  }

  CBC.encryptblock = function (blockbuf, ivbuf, blockcipher, cipherkeybuf) {
    let xorbuf = CBC.xorbufs(blockbuf, ivbuf)
    let encbuf = blockcipher.encrypt(xorbuf, cipherkeybuf)
    return encbuf
  }

  CBC.decryptblock = function (encbuf, ivbuf, blockcipher, cipherkeybuf) {
    let xorbuf = blockcipher.decrypt(encbuf, cipherkeybuf)
    let blockbuf = CBC.xorbufs(xorbuf, ivbuf)
    return blockbuf
  }

  CBC.encryptblocks = function (blockbufs, ivbuf, blockcipher, cipherkeybuf) {
    let encbufs = []

    for (let i = 0; i < blockbufs.length; i++) {
      let blockbuf = blockbufs[i]
      let encbuf = CBC.encryptblock(blockbuf, ivbuf, blockcipher, cipherkeybuf)

      encbufs.push(encbuf)

      ivbuf = encbuf
    }

    return encbufs
  }

  CBC.decryptblocks = function (encbufs, ivbuf, blockcipher, cipherkeybuf) {
    let blockbufs = []

    for (let i = 0; i < encbufs.length; i++) {
      let encbuf = encbufs[i]
      let blockbuf = CBC.decryptblock(encbuf, ivbuf, blockcipher, cipherkeybuf)

      blockbufs.push(blockbuf)

      ivbuf = encbuf
    }

    return blockbufs
  }

  CBC.pkcs7pad = function (buf, blocksize) {
    let bytesize = blocksize / 8
    let padbytesize = bytesize - buf.length
    let pad = new Buffer(padbytesize)
    pad.fill(padbytesize)
    let paddedbuf = Buffer.concat([buf, pad])
    return paddedbuf
  }

  CBC.pkcs7unpad = function (paddedbuf, blocksize) {
    let bytesize = blocksize / 8
    let padbytesize = bytesize - paddedbuf.length
    let padlength = paddedbuf[paddedbuf.length - 1]
    let padbuf = paddedbuf.slice(paddedbuf.length - padlength, paddedbuf.length)
    let padbuf2 = new Buffer(padlength)
    padbuf2.fill(padlength)
    if (!cmp(padbuf, padbuf2))
      throw new Error('invalid padding')
    return paddedbuf.slice(0, paddedbuf.length - padlength)
  }

  CBC.xorbufs = function (buf1, buf2) {
    if (buf1.length !== buf2.length)
      throw new Error('bufs must have the same length')

    let buf = new Buffer(buf1.length)

    for (let i = 0; i < buf1.length; i++) {
      buf[i] = buf1[i] ^ buf2[i]
    }

    return buf
  }

  return CBC
}

inject = require('./injector')(inject, dependencies)
let CBC = inject()
module.exports = CBC
