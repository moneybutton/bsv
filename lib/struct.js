/**
 * Structure
 * =========
 *
 * A convenient structure to extend objects from that comes with very common
 * boiler plate methods:
 * - fromObject
 * - fromBR
 * - toBW
 * - fromBuffer
 * - toBuffer
 * - fromHex
 * - toHex
 * - fromString
 * - toString
 */
'use strict'
let dependencies = {
  BR: require('./br'),
  BW: require('./bw')
}

function inject (deps) {
  let BR = deps.BR
  let BW = deps.BW

  function Struct () {
    if (!(this instanceof Struct)) {
      return new Struct()
    }
  }

  Struct.prototype.fromObject = function (obj) {
    if (!obj) {
      return this
    }
    for (let key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        this[key] = obj[key]
      }
    }
    return this
  }

  Struct.prototype.fromBR = function (br /*, ...rest*/) {
    if (!(br instanceof BR)) {
      throw new Error('br must be a buffer reader')
    }
    throw new Error('not implemented')
  }

  Struct.prototype.toBW = function (bw /*...rest*/) {
    throw new Error('not implemented')
  }

  /**
   * It is very often the case that you want to create a bitcoin object from a
   * stream of small buffers rather than from a buffer of the correct length.
   * For instance, if streaming from the network or disk. The fromBuffers
   * method is a generator which produces an iterator. Use .next(buf) to pass
   * in a small buffer. The iterator will end when it has received enough data
   * to produce the object. In some cases it is able to yield the number of
   * bytes it is expecting, but that is not always known.
   */
  Struct.prototype.fromBuffers = function *() {
    throw new Error('not implemented')
  }

  /**
   * A convenience method used by from the fromBuffers* generators. Basically
   * lets you expect a certain number of bytes (len) and keeps yielding until
   * you give it enough. It yields the expected amount remaining, and returns
   * an object containing a buffer of the expected length, and, if any, the
   * remainder buffer.
   */
  Struct.prototype.expect = function *(len, startbuf) {
    let buf = startbuf
    let bw = BW()
    let gotlen = 0
    if (startbuf) {
      bw.write(startbuf)
      gotlen += startbuf.length
    }
    let remainderbuf
    while (gotlen < len) {
      let remainderlen = (len - gotlen)
      buf = yield remainderlen
      if (!buf)
        continue
      bw.write(buf)
      gotlen += buf.length
    }
    buf = bw.toBuffer()
    let overlen = gotlen - len
    remainderbuf = buf.slice(buf.length - overlen, buf.length)
    buf = buf.slice(0, buf.length - overlen)
    return {
      buf: buf,
      remainderbuf: remainderbuf
    }
  }

  Struct.prototype.fromBuffer = function (buf /*, ...rest*/) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('buf must be a buffer')
    }
    let rest = Array.prototype.slice.call(arguments, 1)
    let br = BR(buf)
    let args = [br].concat(rest)
    return this.fromBR.apply(this, args)
  }

  Struct.prototype.toBuffer = function ( /*...rest*/) {
    return this.toBW.apply(this, arguments).toBuffer()
  }

  Struct.prototype.fromHex = function (hex /*, ...rest*/) {
    let rest = Array.prototype.slice.call(arguments, 1)
    let buf
    try {
      buf = new Buffer(hex, 'hex')
    } catch (e) {
      throw new Error('invalid hex string')
    }
    let args = [buf].concat(rest)
    return this.fromBuffer.apply(this, args)
  }

  Struct.prototype.toHex = function ( /*...rest*/) {
    return this.toBuffer.apply(this, arguments).toString('hex')
  }

  Struct.prototype.fromString = function (str /*, ...rest*/) {
    if (typeof str !== 'string') {
      throw new Error('str must be a string')
    }
    return this.fromHex.apply(this, arguments)
  }

  Struct.prototype.toString = function ( /*...rest*/) {
    return this.toHex.apply(this, arguments)
  }

  Struct.prototype.fromJSON = function (json /*, ...rest*/) {
    throw new Error('not implemented')
  }

  Struct.prototype.toJSON = function ( /*...rest*/) {
    throw new Error('not implemented')
  }

  return Struct
}

inject = require('./injector')(inject, dependencies)
let Struct = inject()
module.exports = Struct
