/**
 * Public Key
 * ==========
 *
 * A public key corresponds to a private key. If you have a private key, you
 * can find the corresponding public key with new PubKey().fromPrivKey(privKey).
 */
'use strict'

import { Point } from './point'
import { Bn } from './bn'
import { Bw } from './bw'
import { Struct } from './struct'
import { Workers } from './workers'

class PubKey extends Struct {
  constructor (point, compressed) {
    super({ point, compressed })
  }

  fromJSON (json) {
    this.fromFastHex(json)
    return this
  }

  toJSON () {
    return this.toFastHex()
  }

  fromPrivKey (privKey) {
    this.fromObject({
      point: Point.getG().mul(privKey.bn),
      compressed: privKey.compressed
    })
    return this
  }

  static fromPrivKey (privKey) {
    return new this().fromPrivKey(privKey)
  }

  async asyncFromPrivKey (privKey) {
    const workersResult = await Workers.asyncObjectMethod(this, 'fromPrivKey', [
      privKey
    ])
    return this.fromFastBuffer(workersResult.resbuf)
  }

  static asyncFromPrivKey (privKey) {
    return new this().asyncFromPrivKey(privKey)
  }

  fromBuffer (buf, strict) {
    return this.fromDer(buf, strict)
  }

  async asyncFromBuffer (buf, strict) {
    const args = [buf, strict]
    const workersResult = await Workers.asyncObjectMethod(
      this,
      'fromBuffer',
      args
    )
    return this.fromFastBuffer(workersResult.resbuf)
  }

  fromFastBuffer (buf) {
    if (buf.length === 0) {
      return this
    }
    const compressed = Boolean(buf[0])
    buf = buf.slice(1)
    this.fromDer(buf)
    this.compressed = compressed
    return this
  }

  /**
     * In order to mimic the non-strict style of OpenSSL, set strict = false. For
     * information and what prefixes 0x06 and 0x07 mean, in addition to the normal
     * compressed and uncompressed public keys, see the message by Peter Wuille
     * where he discovered these "hybrid pubKeys" on the mailing list:
     * http://sourceforge.net/p/bitcoin/mailman/message/29416133/
     */
  fromDer (buf, strict) {
    if (strict === undefined) {
      strict = true
    } else {
      strict = false
    }
    if (
      buf[0] === 0x04 ||
        (!strict && (buf[0] === 0x06 || buf[0] === 0x07))
    ) {
      const xbuf = buf.slice(1, 33)
      const ybuf = buf.slice(33, 65)
      if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
        throw new Error('LEngth of x and y must be 32 bytes')
      }
      const x = new Bn(xbuf)
      const y = new Bn(ybuf)
      this.point = new Point(x, y)
      this.compressed = false
    } else if (buf[0] === 0x03) {
      const xbuf = buf.slice(1)
      const x = new Bn(xbuf)
      this.fromX(true, x)
      this.compressed = true
    } else if (buf[0] === 0x02) {
      const xbuf = buf.slice(1)
      const x = new Bn(xbuf)
      this.fromX(false, x)
      this.compressed = true
    } else {
      throw new Error('Invalid DER format pubKey')
    }
    return this
  }

  static fromDer (buf, strict) {
    return new this().fromDer(buf, strict)
  }

  fromString (str) {
    this.fromDer(Buffer.from(str, 'hex'))
    return this
  }

  fromX (odd, x) {
    if (typeof odd !== 'boolean') {
      throw new Error('Must specify whether y is odd or not (true or false)')
    }
    this.point = Point.fromX(odd, x)
    return this
  }

  static fromX (odd, x) {
    return new this().fromX(odd, x)
  }

  toBuffer () {
    const compressed = this.compressed === undefined ? true : this.compressed
    return this.toDer(compressed)
  }

  toFastBuffer () {
    if (!this.point) {
      return Buffer.alloc(0)
    }
    const bw = new Bw()
    const compressed =
        this.compressed === undefined ? true : Boolean(this.compressed)
    bw.writeUInt8(Number(compressed))
    bw.write(this.toDer(false))
    return bw.toBuffer()
  }

  toDer (compressed) {
    compressed = compressed === undefined ? this.compressed : compressed
    if (typeof compressed !== 'boolean') {
      throw new Error(
        'Must specify whether the public key is compressed or not (true or false)'
      )
    }

    const x = this.point.getX()
    const y = this.point.getY()

    const xbuf = x.toBuffer({ size: 32 })
    const ybuf = y.toBuffer({ size: 32 })

    let prefix
    if (!compressed) {
      prefix = Buffer.from([0x04])
      return Buffer.concat([prefix, xbuf, ybuf])
    } else {
      const odd = ybuf[ybuf.length - 1] % 2
      if (odd) {
        prefix = Buffer.from([0x03])
      } else {
        prefix = Buffer.from([0x02])
      }
      return Buffer.concat([prefix, xbuf])
    }
  }

  toString () {
    const compressed = this.compressed === undefined ? true : this.compressed
    return this.toDer(compressed).toString('hex')
  }

  /**
     * Translated from bitcoind's IsCompressedOrUncompressedPubKey
     */
  static isCompressedOrUncompressed (buf) {
    if (buf.length < 33) {
      //  Non-canonical public key: too short
      return false
    }
    if (buf[0] === 0x04) {
      if (buf.length !== 65) {
        //  Non-canonical public key: invalid length for uncompressed key
        return false
      }
    } else if (buf[0] === 0x02 || buf[0] === 0x03) {
      if (buf.length !== 33) {
        //  Non-canonical public key: invalid length for compressed key
        return false
      }
    } else {
      //  Non-canonical public key: neither compressed nor uncompressed
      return false
    }
    return true
  }

  // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
  validate () {
    if (this.point.isInfinity()) {
      throw new Error('point: Point cannot be equal to Infinity')
    }
    if (this.point.eq(new Point(new Bn(0), new Bn(0)))) {
      throw new Error('point: Point cannot be equal to 0, 0')
    }
    this.point.validate()
    return this
  }
}

export { PubKey }
