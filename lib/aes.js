/**
 * Aes (experimental)
 * ==================
 *
 * Advanced Encryption Standard (Aes). This is a low-level tool for encrypting
 * or decrypting blocks of data. There is almost never a reason to use this -
 * don't use it unless you need to encrypt or decrypt individual blocks.
 */
'use strict'
let dependencies = {
  _Aes: require('aes')
}

let inject = function (deps) {
  let _Aes = deps._Aes
  let Aes = {}

  Aes.encrypt = function (messageBuf, keybuf) {
    let key = Aes.buf2words(keybuf)
    let message = Aes.buf2words(messageBuf)
    let a = new _Aes(key)
    let enc = a.encrypt(message)
    let encBuf = Aes.words2buf(enc)
    return encBuf
  }

  Aes.decrypt = function (encBuf, keybuf) {
    let enc = Aes.buf2words(encBuf)
    let key = Aes.buf2words(keybuf)
    let a = new _Aes(key)
    let message = a.decrypt(enc)
    let messageBuf = Aes.words2buf(message)
    return messageBuf
  }

  Aes.buf2words = function (buf) {
    if (buf.length % 4) {
      throw new Error('buf length must be a multiple of 4')
    }

    let words = []

    for (let i = 0; i < buf.length / 4; i++) {
      words.push(buf.readUInt32BE(i * 4))
    }

    return words
  }

  Aes.words2buf = function (words) {
    let buf = new Buffer(words.length * 4)

    for (let i = 0; i < words.length; i++) {
      buf.writeUInt32BE(words[i], i * 4)
    }

    return buf
  }

  return Aes
}

inject = require('injecter')(inject, dependencies)
let Aes = inject()
module.exports = Aes
