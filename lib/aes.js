/**
 * AES (experimental)
 * ==================
 *
 * Advanced Encryption Standard (AES). This is a low-level tool for encrypting
 * or decrypting blocks of data. There is almost never a reason to use this -
 * don't use it unless you need to encrypt or decrypt individual blocks.
 */
'use strict'
let dependencies = {
  Aes: require('aes')
}

let inject = function (deps) {
  let Aes = deps.Aes
  let AES = {}

  AES.encrypt = function (messagebuf, keybuf) {
    let key = AES.buf2words(keybuf)
    let message = AES.buf2words(messagebuf)
    let a = new Aes(key)
    let enc = a.encrypt(message)
    let encbuf = AES.words2buf(enc)
    return encbuf
  }

  AES.decrypt = function (encbuf, keybuf) {
    let enc = AES.buf2words(encbuf)
    let key = AES.buf2words(keybuf)
    let a = new Aes(key)
    let message = a.decrypt(enc)
    let messagebuf = AES.words2buf(message)
    return messagebuf
  }

  AES.buf2words = function (buf) {
    if (buf.length % 4) {
      throw new Error('buf length must be a multiple of 4')
    }

    let words = []

    for (let i = 0; i < buf.length / 4; i++) {
      words.push(buf.readUInt32BE(i * 4))
    }

    return words
  }

  AES.words2buf = function (words) {
    let buf = new Buffer(words.length * 4)

    for (let i = 0; i < words.length; i++) {
      buf.writeUInt32BE(words[i], i * 4)
    }

    return buf
  }

  return AES
}

inject = require('injecter')(inject, dependencies)
let AES = inject()
module.exports = AES
