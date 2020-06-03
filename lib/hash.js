/**
 * Hash
 * ====
 *
 * Some hash functions are used through out bitcoin. We expose them here as a
 * convenience.
 */
'use strict'

import { Workers } from './workers'
import hashjs from 'hash.js'

class Hash {}

Hash.sha1 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha1 hash must be of a buffer')
  }
  const Sha1 = hashjs.sha1
  const hash = new Sha1().update(buf).digest()
  return Buffer.from(hash)
}

Hash.sha1.blockSize = 512

Hash.asyncSha1 = async function (buf) {
  const args = [buf]
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha1', args)
  return workersResult.resbuf
}

Hash.sha256 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha256 hash must be of a buffer')
  }
  const Sha256 = hashjs.sha256
  const hash = new Sha256().update(buf).digest()
  return Buffer.from(hash)
}

Hash.sha256.blockSize = 512

Hash.asyncSha256 = async function (buf) {
  const args = [buf]
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha256', args)
  return workersResult.resbuf
}

Hash.sha256Sha256 = function (buf) {
  try {
    return Hash.sha256(Hash.sha256(buf))
  } catch (e) {
    throw new Error('sha256Sha256 hash must be of a buffer: ' + e)
  }
}

Hash.asyncSha256Sha256 = async function (buf) {
  const args = [buf]
  const workersResult = await Workers.asyncClassMethod(
    Hash,
    'sha256Sha256',
    args
  )
  return workersResult.resbuf
}

Hash.ripemd160 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('ripemd160 hash must be of a buffer')
  }
  const Ripemd160 = hashjs.ripemd160
  const hash = new Ripemd160().update(buf).digest()
  return Buffer.from(hash)
}

Hash.asyncRipemd160 = async function (buf) {
  const args = [buf]
  const workersResult = await Workers.asyncClassMethod(Hash, 'ripemd160', args)
  return workersResult.resbuf
}

Hash.sha256Ripemd160 = function (buf) {
  try {
    return Hash.ripemd160(Hash.sha256(buf))
  } catch (e) {
    throw new Error('sha256Ripemd160 hash must be of a buffer: ' + e)
  }
}

Hash.asyncSha256Ripemd160 = async function (buf) {
  const args = [buf]
  const workersResult = await Workers.asyncClassMethod(
    Hash,
    'sha256Ripemd160',
    args
  )
  return workersResult.resbuf
}

Hash.sha512 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha512 hash must be of a buffer')
  }
  const Sha512 = hashjs.sha512
  const hash = new Sha512().update(buf).digest()
  return Buffer.from(hash)
}

Hash.asyncSha512 = async function (buf) {
  const args = [buf]
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha512', args)
  return workersResult.resbuf
}

Hash.sha512.blockSize = 1024

Hash.hmac = function (hashFStr, data, key) {
  if (hashFStr !== 'sha1' && hashFStr !== 'sha256' && hashFStr !== 'sha512') {
    throw new Error('invalid choice of hash function')
  }

  const hashf = Hash[hashFStr]

  if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key)) {
    throw new Error('data and key must be buffers')
  }

  // http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
  // http://tools.ietf.org/html/rfc4868#section-2
  const blockSize = hashf.blockSize / 8

  if (key.length > blockSize) {
    key = hashf(key)
  }

  if (key.length < blockSize) {
    const fill = Buffer.alloc(blockSize)
    fill.fill(0, key.length)
    key.copy(fill)
    key = fill
  }

  const oKeyPad = Buffer.alloc(blockSize)
  const iKeyPad = Buffer.alloc(blockSize)
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = 0x5c ^ key[i]
    iKeyPad[i] = 0x36 ^ key[i]
  }

  return hashf(
    Buffer.concat([oKeyPad, hashf(Buffer.concat([iKeyPad, data]))])
  )
}

Hash.sha1Hmac = function (data, key) {
  return Hash.hmac('sha1', data, key)
}

Hash.asyncSha1Hmac = async function (data, key) {
  const args = [data, key]
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha1Hmac', args)
  return workersResult.resbuf
}

Hash.sha1Hmac.bitsize = 160

Hash.sha256Hmac = function (data, key) {
  return Hash.hmac('sha256', data, key)
}

Hash.asyncSha256Hmac = async function (data, key) {
  const args = [data, key]
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Hmac', args)
  return workersResult.resbuf
}

Hash.sha256Hmac.bitsize = 256

Hash.sha512Hmac = function (data, key) {
  return Hash.hmac('sha512', data, key)
}

Hash.asyncSha512Hmac = async function (data, key) {
  const args = [data, key]
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha512Hmac', args)
  return workersResult.resbuf
}

Hash.sha512Hmac.bitsize = 512

export { Hash }
