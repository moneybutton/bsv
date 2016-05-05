/**
 * Hash
 * ====
 *
 * Some hash functions are used through out bitcoin. We expose them here as a
 * convenience.
 */
'use strict'
let dependencies = {
  Workers: require('./workers'),
  asink: require('asink'),
  hashjs: require('hash.js')
}

let inject = function (deps) {
  let Workers = deps.Workers
  let asink = deps.asink
  let hashjs = deps.hashjs

  let Hash = {}

  Hash.sha1 = function (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('sha1 hash must be of a buffer')
    }
    let Sha1 = hashjs.sha1
    let hash = (new Sha1()).update(buf).digest()
    return new Buffer(hash)
  }

  Hash.sha1.blockSize = 512

  Hash.asyncSha1 = function (buf) {
    return asink(function * () {
      let args = [buf]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha1', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha256 = function (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('sha256 hash must be of a buffer')
    }
    let Sha256 = hashjs.sha256
    let hash = (new Sha256()).update(buf).digest()
    return new Buffer(hash)
  }

  Hash.sha256.blockSize = 512

  Hash.asyncSha256 = function (buf) {
    return asink(function * () {
      let args = [buf]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha256', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha256Sha256 = function (buf) {
    try {
      return Hash.sha256(Hash.sha256(buf))
    } catch (e) {
      throw new Error('sha256Sha256 hash must be of a buffer: ' + e)
    }
  }

  Hash.asyncSha256Sha256 = function (buf) {
    return asink(function * () {
      let args = [buf]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha256Sha256', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.ripemd160 = function (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('ripemd160 hash must be of a buffer')
    }
    let Ripemd160 = hashjs.ripemd160
    let hash = (new Ripemd160()).update(buf).digest()
    return new Buffer(hash)
  }

  Hash.asyncRipemd160 = function (buf) {
    return asink(function * () {
      let args = [buf]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'ripemd160', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha256Ripemd160 = function (buf) {
    try {
      return Hash.ripemd160(Hash.sha256(buf))
    } catch (e) {
      throw new Error('sha256Ripemd160 hash must be of a buffer: ' + e)
    }
  }

  Hash.asyncSha256Ripemd160 = function (buf) {
    return asink(function * () {
      let args = [buf]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha256Ripemd160', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha512 = function (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('sha512 hash must be of a buffer')
    }
    let Sha512 = hashjs.sha512
    let hash = (new Sha512()).update(buf).digest()
    return new Buffer(hash)
  }

  Hash.asyncSha512 = function (buf) {
    return asink(function * () {
      let args = [buf]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha512', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha512.blockSize = 1024

  Hash.hmac = function (hashFStr, data, key) {
    if (hashFStr !== 'sha1' && hashFStr !== 'sha256' && hashFStr !== 'sha512') {
      throw new Error('invalid choice of hash function')
    }

    let hashf = Hash[hashFStr]

    if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key)) {
      throw new Error('data and key must be buffers')
    }

    // http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
    // http://tools.ietf.org/html/rfc4868#section-2
    let blockSize = hashf.blockSize / 8

    if (key.length > blockSize) {
      key = hashf(key)
    }

    if (key.length < blockSize) {
      let fill = new Buffer(blockSize)
      fill.fill(0, key.length)
      key.copy(fill)
      key = fill
    }

    let oKeyPad = new Buffer(blockSize)
    let iKeyPad = new Buffer(blockSize)
    for (let i = 0; i < blockSize; i++) {
      oKeyPad[i] = 0x5c ^ key[i]
      iKeyPad[i] = 0x36 ^ key[i]
    }

    return hashf(Buffer.concat([oKeyPad, hashf(Buffer.concat([iKeyPad, data]))]))
  }

  Hash.sha1Hmac = function (data, key) {
    return Hash.hmac('sha1', data, key)
  }

  Hash.asyncSha1Hmac = function (data, key) {
    return asink(function * () {
      let args = [data, key]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha1Hmac', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha1Hmac.bitsize = 160

  Hash.sha256Hmac = function (data, key) {
    return Hash.hmac('sha256', data, key)
  }

  Hash.asyncSha256Hmac = function (data, key) {
    return asink(function * () {
      let args = [data, key]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha256Hmac', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha256Hmac.bitsize = 256

  Hash.sha512Hmac = function (data, key) {
    return Hash.hmac('sha512', data, key)
  }

  Hash.asyncSha512Hmac = function (data, key) {
    return asink(function * () {
      let args = [data, key]
      let workersResult = yield Workers.asyncClassMethod('Hash', 'sha512Hmac', args)
      return workersResult.resbuf
    }, this)
  }

  Hash.sha512Hmac.bitsize = 512

  return Hash
}

inject = require('injecter')(inject, dependencies)
let Hash = inject()
module.exports = Hash
