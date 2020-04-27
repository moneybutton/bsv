/**
 * Cbc (experimental)
 * ==================
 *
 * Cipher Block ChainIng (Cbc). This is a low-level tool for chainIng multiple
 * encrypted blocks together, usually with Aes. This is a low-level tool that
 * does not include authentication. You should only be using this if you have
 * authentication at another step. It is best combined with Hmac.
 *
 * http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher-block_chainIng_.28Cbc.29
 */
'use strict'

let cmp = require('./cmp')

class Cbc {}

Cbc.buf2BlocksBuf = function (buf, blockSize) {
  let bytesize = blockSize / 8
  let blockBufs = []

  for (let i = 0; i <= buf.length / bytesize; i++) {
    let blockBuf = buf.slice(i * bytesize, i * bytesize + bytesize)

    if (blockBuf.length < blockSize) {
      blockBuf = Cbc.pkcs7Pad(blockBuf, blockSize)
    }

    blockBufs.push(blockBuf)
  }

  return blockBufs
}

Cbc.blockBufs2Buf = function (blockBufs) {
  let last = blockBufs[blockBufs.length - 1]
  last = Cbc.pkcs7Unpad(last)
  blockBufs[blockBufs.length - 1] = last

  let buf = Buffer.concat(blockBufs)

  return buf
}

Cbc.encrypt = function (messageBuf, ivBuf, blockCipher, cipherKeyBuf) {
  let blockSize = ivBuf.length * 8
  let blockBufs = Cbc.buf2BlocksBuf(messageBuf, blockSize)
  let encBufs = Cbc.encryptBlocks(blockBufs, ivBuf, blockCipher, cipherKeyBuf)
  let encBuf = Buffer.concat(encBufs)
  return encBuf
}

Cbc.decrypt = function (encBuf, ivBuf, blockCipher, cipherKeyBuf) {
  let bytesize = ivBuf.length
  let encBufs = []
  for (let i = 0; i < encBuf.length / bytesize; i++) {
    encBufs.push(encBuf.slice(i * bytesize, i * bytesize + bytesize))
  }
  let blockBufs = Cbc.decryptBlocks(encBufs, ivBuf, blockCipher, cipherKeyBuf)
  let buf = Cbc.blockBufs2Buf(blockBufs)
  return buf
}

Cbc.encryptBlock = function (blockBuf, ivBuf, blockCipher, cipherKeyBuf) {
  let xorbuf = Cbc.xorBufs(blockBuf, ivBuf)
  let encBuf = blockCipher.encrypt(xorbuf, cipherKeyBuf)
  return encBuf
}

Cbc.decryptBlock = function (encBuf, ivBuf, blockCipher, cipherKeyBuf) {
  let xorbuf = blockCipher.decrypt(encBuf, cipherKeyBuf)
  let blockBuf = Cbc.xorBufs(xorbuf, ivBuf)
  return blockBuf
}

Cbc.encryptBlocks = function (blockBufs, ivBuf, blockCipher, cipherKeyBuf) {
  let encBufs = []

  for (let i = 0; i < blockBufs.length; i++) {
    let blockBuf = blockBufs[i]
    let encBuf = Cbc.encryptBlock(blockBuf, ivBuf, blockCipher, cipherKeyBuf)

    encBufs.push(encBuf)

    ivBuf = encBuf
  }

  return encBufs
}

Cbc.decryptBlocks = function (encBufs, ivBuf, blockCipher, cipherKeyBuf) {
  let blockBufs = []

  for (let i = 0; i < encBufs.length; i++) {
    let encBuf = encBufs[i]
    let blockBuf = Cbc.decryptBlock(encBuf, ivBuf, blockCipher, cipherKeyBuf)

    blockBufs.push(blockBuf)

    ivBuf = encBuf
  }

  return blockBufs
}

Cbc.pkcs7Pad = function (buf, blockSize) {
  let bytesize = blockSize / 8
  let padbytesize = bytesize - buf.length
  let pad = Buffer.alloc(padbytesize)
  pad.fill(padbytesize)
  let paddedbuf = Buffer.concat([buf, pad])
  return paddedbuf
}

Cbc.pkcs7Unpad = function (paddedbuf) {
  let padlength = paddedbuf[paddedbuf.length - 1]
  let padbuf = paddedbuf.slice(paddedbuf.length - padlength, paddedbuf.length)
  let padbuf2 = Buffer.alloc(padlength)
  padbuf2.fill(padlength)
  if (!cmp(padbuf, padbuf2)) {
    throw new Error('invalid padding')
  }
  return paddedbuf.slice(0, paddedbuf.length - padlength)
}

Cbc.xorBufs = function (buf1, buf2) {
  if (buf1.length !== buf2.length) {
    throw new Error('bufs must have the same length')
  }

  let buf = Buffer.alloc(buf1.length)

  for (let i = 0; i < buf1.length; i++) {
    buf[i] = buf1[i] ^ buf2[i]
  }

  return buf
}

module.exports = Cbc
