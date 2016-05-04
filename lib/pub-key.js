/**
 * Public Key
 * ==========
 *
 * A public key corresponds to a private key. If you have a private key, you
 * can find the corresponding public key with new PubKey().fromPrivKey(privKey).
 */
'use strict'
let dependencies = {
  Point: require('./point'),
  Bn: require('./bn'),
  Bw: require('./bw'),
  Struct: require('./struct'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Point = deps.Point
  let Bn = deps.Bn
  let Bw = deps.Bw
  let Struct = deps.Struct
  let Workers = deps.Workers
  let asink = deps.asink

  let PubKey = function PubKey (point) {
    if (!(this instanceof PubKey)) {
      return new PubKey(point)
    }
    if (point instanceof Point) {
      this.point = point
    } else if (point) {
      let obj = point
      this.fromObject(obj)
    }
  }

  PubKey.prototype = Object.create(Struct.prototype)
  PubKey.prototype.constructor = PubKey

  PubKey.prototype.fromJson = function (json) {
    this.fromBuffer(new Buffer(json, 'hex'))
    return this
  }

  PubKey.prototype.toJson = function () {
    return this.toBuffer().toString('hex')
  }

  PubKey.prototype.fromPrivKey = function (privKey) {
    this.fromObject({
      point: Point.getG().mul(privKey.bn),
      compressed: privKey.compressed
    })
    return this
  }

  PubKey.prototype.asyncFromPrivKey = function (privKey) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromPrivKey', [privKey])
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  PubKey.prototype.fromBuffer = function (buf, strict) {
    return this.fromDer(buf, strict)
  }

  PubKey.prototype.asyncFromBuffer = function (buf, strict) {
    return asink(function * () {
      let args = [buf]
      if (strict) {
        args.push(strict)
      }
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromBuffer', args)
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  PubKey.prototype.fromFastBuffer = function (buf) {
    if (buf.length === 0) {
      return this
    }
    buf = buf.slice(1)
    this.fromDer(buf)
    this.compressed = Boolean(buf[0])
    return this
  }

  /**
   * In order to mimic the non-strict style of OpenSSL, set strict = false. For
   * information and what prefixes 0x06 and 0x07 mean, in addition to the normal
   * compressed and uncompressed public keys, see the message by Peter Wuille
   * where he discovered these "hybrid pubKeys" on the mailing list:
   * http://sourceforge.net/p/bitcoin/mailman/message/29416133/
   */
  PubKey.prototype.fromDer = function (buf, strict) {
    if (strict === undefined) {
      strict = true
    } else {
      strict = false
    }
    if (buf[0] === 0x04 || (!strict && (buf[0] === 0x06 || buf[0] === 0x07))) {
      let xbuf = buf.slice(1, 33)
      let ybuf = buf.slice(33, 65)
      if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
        throw new Error('LEngth of x and y must be 32 bytes')
      }
      let x = new Bn(xbuf)
      let y = new Bn(ybuf)
      this.point = new Point(x, y)
      this.compressed = false
    } else if (buf[0] === 0x03) {
      let xbuf = buf.slice(1)
      let x = new Bn(xbuf)
      this.fromX(true, x)
      this.compressed = true
    } else if (buf[0] === 0x02) {
      let xbuf = buf.slice(1)
      let x = new Bn(xbuf)
      this.fromX(false, x)
      this.compressed = true
    } else {
      throw new Error('Invalid DER format pubKey')
    }
    return this
  }

  PubKey.prototype.fromString = function (str) {
    this.fromDer(new Buffer(str, 'hex'))
    return this
  }

  PubKey.prototype.fromX = function (odd, x) {
    if (typeof odd !== 'boolean') {
      throw new Error('Must specify whether y is odd or not (true or false)')
    }
    this.point = Point.fromX(odd, x)
    return this
  }

  PubKey.prototype.toBuffer = function () {
    let compressed = this.compressed === undefined ? true : this.compressed
    return this.toDer(compressed)
  }

  PubKey.prototype.toFastBuffer = function () {
    if (!this.point) {
      return new Buffer(0)
    }
    let bw = new Bw()
    let compressed = this.compressed === undefined ? true : this.compressed
    bw.writeUInt8(Number(compressed))
    bw.write(this.toDer(false))
    return bw.toBuffer()
  }

  PubKey.prototype.toDer = function (compressed) {
    compressed = compressed === undefined ? this.compressed : compressed
    if (typeof compressed !== 'boolean') {
      throw new Error('Must specify whether the public key is compressed or not (true or false)')
    }

    let x = this.point.getX()
    let y = this.point.getY()

    let xbuf = x.toBuffer({size: 32})
    let ybuf = y.toBuffer({size: 32})

    let prefix
    if (!compressed) {
      prefix = new Buffer([0x04])
      return Buffer.concat([prefix, xbuf, ybuf])
    } else {
      let odd = ybuf[ybuf.length - 1] % 2
      if (odd) {
        prefix = new Buffer([0x03])
      } else {
        prefix = new Buffer([0x02])
      }
      return Buffer.concat([prefix, xbuf])
    }
  }

  PubKey.prototype.toString = function () {
    let compressed = this.compressed === undefined ? true : this.compressed
    return this.toDer(compressed).toString('hex')
  }

  /**
   * Translated from bitcoind's IsCompressedOrUncompressedPubKey
   */
  PubKey.isCompressedOrUncompressed = function (buf) {
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
  PubKey.prototype.validate = function () {
    if (this.point.isInfinity()) {
      throw new Error('point: Point cannot be equal to Infinity')
    }
    if (this.point.eq(new Point(new Bn(0), new Bn(0)))) {
      throw new Error('point: Point cannot be equal to 0, 0')
    }
    this.point.validate()
    return this
  }

  return PubKey
}

inject = require('injecter')(inject, dependencies)
let PubKey = inject()
module.exports = PubKey
