/**
 * Aes (experimental)
 * ==================
 *
 * Advanced Encryption Standard (Aes). This is a low-level tool for encrypting
 * or decrypting blocks of data. There is almost never a reason to use this -
 * don't use it unless you need to encrypt or decrypt individual blocks.
 */
'use strict'

import _Aes from 'aes'

class Aes { }

Aes.encrypt = function (messageBuf, keyBuf) {
  const key = Aes.buf2Words(keyBuf)
  const message = Aes.buf2Words(messageBuf)
  const a = new _Aes(key)
  const enc = a.encrypt(message)
  const encBuf = Aes.words2Buf(enc)
  return encBuf
}

Aes.decrypt = function (encBuf, keyBuf) {
  const enc = Aes.buf2Words(encBuf)
  const key = Aes.buf2Words(keyBuf)
  const a = new _Aes(key)
  const message = a.decrypt(enc)
  const messageBuf = Aes.words2Buf(message)
  return messageBuf
}

Aes.buf2Words = function (buf) {
  if (buf.length % 4) {
    throw new Error('buf length must be a multiple of 4')
  }

  const words = []

  for (let i = 0; i < buf.length / 4; i++) {
    words.push(buf.readUInt32BE(i * 4))
  }

  return words
}

Aes.words2Buf = function (words) {
  const buf = Buffer.alloc(words.length * 4)

  for (let i = 0; i < words.length; i++) {
    buf.writeUInt32BE(words[i], i * 4)
  }

  return buf
}

export { Aes }
