/**
 * Ecies
 * =====
 */
'use strict'

import { Aescbc } from './aescbc'
import { cmp } from './cmp'
import { Hash } from './hash'
import { KeyPair } from './key-pair'
import { Point } from './point'
import { PubKey } from './pub-key'
import { Random } from './random'
import { Workers } from './workers'

class Ecies {}

Ecies.ivkEkM = function (privKey, pubKey) {
  const r = privKey.bn
  const KB = pubKey.point
  const P = KB.mul(r)
  const S = new PubKey(P)
  const Sbuf = S.toBuffer()
  const hash = Hash.sha512(Sbuf)
  return {
    iv: hash.slice(0, 16),
    kE: hash.slice(16, 32),
    kM: hash.slice(32, 64)
  }
}

Ecies.electrumEncrypt = function (messageBuf, toPubKey, fromKeyPair, noKey = false) {
  if (!Buffer.isBuffer(messageBuf)) {
    throw new Error('messageBuf must be a buffer')
  }
  let Rbuf
  if (fromKeyPair === null) {
    fromKeyPair = KeyPair.fromRandom()
  }
  if (!noKey) {
    Rbuf = fromKeyPair.pubKey.toDer(true)
  }
  const { iv, kE, kM } = Ecies.ivkEkM(fromKeyPair.privKey, toPubKey)
  const ciphertext = Aescbc.encrypt(messageBuf, kE, iv, false)
  const BIE1 = Buffer.from('BIE1')
  let encBuf
  if (Rbuf) {
    encBuf = Buffer.concat([BIE1, Rbuf, ciphertext])
  } else {
    encBuf = Buffer.concat([BIE1, ciphertext])
  }
  const hmac = Hash.sha256Hmac(encBuf, kM)
  return Buffer.concat([encBuf, hmac])
}

Ecies.electrumDecrypt = function (encBuf, toPrivKey, fromPubKey = null) {
  if (!Buffer.isBuffer(encBuf)) {
    throw new Error('encBuf must be a buffer')
  }
  const tagLength = 32

  const magic = encBuf.slice(0, 4)
  if (!magic.equals(Buffer.from('BIE1'))) {
    throw new Error('Invalid Magic')
  }
  let offset = 4
  if (fromPubKey === null) {
    // BIE1 use compressed public key, length is always 33.
    const pub = encBuf.slice(4, 37)
    fromPubKey = PubKey.fromDer(pub)
    offset = 37
  }
  const { iv, kE, kM } = Ecies.ivkEkM(toPrivKey, fromPubKey)
  const ciphertext = encBuf.slice(offset, encBuf.length - tagLength)
  const hmac = encBuf.slice(encBuf.length - tagLength, encBuf.length)

  const hmac2 = Hash.sha256Hmac(encBuf.slice(0, encBuf.length - tagLength), kM)

  if (!hmac.equals(hmac2)) {
    throw new Error('Invalid checksum')
  }
  return Aescbc.decrypt(ciphertext, kE, iv)
}

Ecies.bitcoreEncrypt = function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
  if (!fromKeyPair) {
    fromKeyPair = KeyPair.fromRandom()
  }
  const r = fromKeyPair.privKey.bn
  const RPubKey = fromKeyPair.pubKey
  const RBuf = RPubKey.toDer(true)
  const KB = toPubKey.point
  const P = KB.mul(r)
  const S = P.getX()
  const Sbuf = S.toBuffer({ size: 32 })
  const kEkM = Hash.sha512(Sbuf)
  const kE = kEkM.slice(0, 32)
  const kM = kEkM.slice(32, 64)
  const c = Aescbc.encrypt(messageBuf, kE, ivBuf)
  const d = Hash.sha256Hmac(c, kM)
  const encBuf = Buffer.concat([RBuf, c, d])
  return encBuf
}

Ecies.asyncBitcoreEncrypt = async function (
  messageBuf,
  toPubKey,
  fromKeyPair,
  ivBuf
) {
  if (!fromKeyPair) {
    fromKeyPair = await KeyPair.asyncFromRandom()
  }
  if (!ivBuf) {
    ivBuf = Random.getRandomBuffer(128 / 8)
  }
  const args = [messageBuf, toPubKey, fromKeyPair, ivBuf]
  const workersResult = await Workers.asyncClassMethod(Ecies, 'bitcoreEncrypt', args)
  return workersResult.resbuf
}

Ecies.bitcoreDecrypt = function (encBuf, toPrivKey) {
  const kB = toPrivKey.bn
  const fromPubKey = PubKey.fromDer(encBuf.slice(0, 33))
  const R = fromPubKey.point
  const P = R.mul(kB)
  if (P.eq(new Point())) {
    throw new Error('P equals 0')
  }
  const S = P.getX()
  const Sbuf = S.toBuffer({ size: 32 })
  const kEkM = Hash.sha512(Sbuf)
  const kE = kEkM.slice(0, 32)
  const kM = kEkM.slice(32, 64)
  const c = encBuf.slice(33, encBuf.length - 32)
  const d = encBuf.slice(encBuf.length - 32, encBuf.length)
  const d2 = Hash.sha256Hmac(c, kM)
  if (!cmp(d, d2)) {
    throw new Error('Invalid checksum')
  }
  const messageBuf = Aescbc.decrypt(c, kE)
  return messageBuf
}

Ecies.asyncBitcoreDecrypt = async function (encBuf, toPrivKey) {
  const args = [encBuf, toPrivKey]
  const workersResult = await Workers.asyncClassMethod(Ecies, 'bitcoreDecrypt', args)
  return workersResult.resbuf
}

export { Ecies }
