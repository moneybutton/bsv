/**
 * Structure
 * =========
 *
 * A convenient structure to extend objects from that comes with very common
 * boiler plate instance methods:
 * - fromObject
 * - fromBr
 * - toBw
 * - fromBuffer
 * - fromFastBuffer
 * - toBuffer
 * - toFastBuffer
 * - fromHex
 * - toHex
 * - fromString
 * - toString
 * - fromJSON
 * - toJSON
 * - cloneByBuffer
 * - cloneByFastBuffer
 * - cloneByHex
 * - cloneByString
 * - cloneByJSON
 *
 * As well as static methods for:
 * - fromObject
 * - fromBr
 * - fromBuffer
 * - fromFastBuffer
 * - fromHex
 * - fromString
 * - fromJSON
 *
 * The "expect" method also facilitates deserializing a sequence of buffers
 * into an object.
 */
'use strict'

import { Br } from './br'
import { Bw } from './bw'
import isHex from 'is-hex'

class Struct {
  constructor (obj) {
    this.fromObject(obj)
  }

  fromObject (obj) {
    if (!obj) {
      return this
    }
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        this[key] = obj[key]
      }
    }
    return this
  }

  static fromObject (obj) {
    return new this().fromObject(obj)
  }

  fromBr (br) {
    if (!(br instanceof Br)) {
      throw new Error('br must be a buffer reader')
    }
    throw new Error('not implemented')
  }

  static fromBr (br) {
    return new this().fromBr(br)
  }

  asyncFromBr (br) {
    if (!(br instanceof Br)) {
      throw new Error('br must be a buffer reader')
    }
    throw new Error('not implemented')
  }

  static asyncFromBr (br) {
    return new this().asyncFromBr(br)
  }

  toBw (bw) {
    throw new Error('not implemented')
  }

  asyncToBw (bw) {
    throw new Error('not implemented')
  }

  /**
     * It is very often the case that you want to create a bitcoin object from a
     * stream of small buffers rather than from a buffer of the correct length.
     * For instance, if streaming from the network or disk. The genFromBuffers
     * method is a generator which produces an iterator. Use .next(buf) to pass
     * in a small buffer. The iterator will end when it has received enough data
     * to produce the object. In some cases it is able to yield the number of
     * bytes it is expecting, but that is not always known.
     */
  * genFromBuffers () {
    throw new Error('not implemented')
  }

  /**
     * A convenience method used by from the genFromBuffers* generators.
     * Basically lets you expect a certain number of bytes (len) and keeps
     * yielding until you give it enough. It yields the expected amount
     * remaining, and returns an object containing a buffer of the expected
     * length, and, if any, the remainder buffer.
     */
  * expect (len, startbuf) {
    let buf = startbuf
    const bw = new Bw()
    let gotlen = 0
    if (startbuf) {
      bw.write(startbuf)
      gotlen += startbuf.length
    }
    while (gotlen < len) {
      const remainderlen = len - gotlen
      buf = yield remainderlen
      if (!buf) {
        continue
      }
      bw.write(buf)
      gotlen += buf.length
    }
    buf = bw.toBuffer()
    const overlen = gotlen - len
    const remainderbuf = buf.slice(buf.length - overlen, buf.length)
    buf = buf.slice(0, buf.length - overlen)
    return {
      buf: buf,
      remainderbuf: remainderbuf
    }
  }

  /**
     * Convert a buffer into an object, i.e. deserialize the object.
     */
  fromBuffer (buf, ...rest) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('buf must be a buffer')
    }
    const br = new Br(buf)
    return this.fromBr(br, ...rest)
  }

  static fromBuffer (...rest) {
    return new this().fromBuffer(...rest)
  }

  asyncFromBuffer (buf, ...rest) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('buf must be a buffer')
    }
    const br = new Br(buf)
    return this.asyncFromBr(br, ...rest)
  }

  static asyncFromBuffer (buf, ...rest) {
    return new this().asyncFromBuffer(buf, ...rest)
  }

  /**
     * The complement of toFastBuffer - see description for toFastBuffer
     */
  fromFastBuffer (buf, ...rest) {
    if (buf.length === 0) {
      return this
    } else {
      return this.fromBuffer(buf, ...rest)
    }
  }

  static fromFastBuffer (...rest) {
    return new this().fromFastBuffer(...rest)
  }

  /**
     * Convert the object into a buffer, i.e. serialize the object. This method
     * may block the main thread.
     */
  toBuffer (...rest) {
    return this.toBw(...rest).toBuffer()
  }

  asyncToBuffer (...rest) {
    return this.asyncToBw(...rest).then(bw => bw.toBuffer())
  }

  /**
     * Sometimes the toBuffer method has cryptography and blocks the main thread,
     * and we need a non-blocking way to serialize an object. That is what
     * toFastBuffer is. Of course it defaults to just using toBuffer if an object
     * hasn't implemented it. If your regular toBuffer method blocks, like with
     * Bip32, then you should implement this method to be non-blocking. This
     * method is used to send objects to the workers. i.e., for converting a
     * Bip32 object to a string, we need to encode it as a buffer in a
     * non-blocking manner with toFastBuffer, send it to a worker, then the
     * worker converts it to a string, which is a blocking operation.
     *
     * It is very common to want to convert a blank object to a zero length
     * buffer, so we can transport a blank object to a worker. So that behavior
     * is included by default.
     */
  toFastBuffer (...rest) {
    if (Object.keys(this).length === 0) {
      return Buffer.alloc(0)
    } else {
      return this.toBuffer(...rest)
    }
  }

  fromHex (hex, ...rest) {
    if (!isHex(hex)) {
      throw new Error('invalid hex string')
    }
    const buf = Buffer.from(hex, 'hex')
    return this.fromBuffer(buf, ...rest)
  }

  static fromHex (hex, ...rest) {
    return new this().fromHex(hex, ...rest)
  }

  asyncFromHex (hex, ...rest) {
    if (!isHex(hex)) {
      throw new Error('invalid hex string')
    }
    const buf = Buffer.from(hex, 'hex')
    return this.asyncFromBuffer(buf, ...rest)
  }

  static asyncFromHex (hex, ...rest) {
    return new this().asyncFromHex(hex, ...rest)
  }

  fromFastHex (hex, ...rest) {
    if (!isHex(hex)) {
      throw new Error('invalid hex string')
    }
    const buf = Buffer.from(hex, 'hex')
    return this.fromFastBuffer(buf, ...rest)
  }

  static fromFastHex (hex, ...rest) {
    return new this().fromFastHex(hex, ...rest)
  }

  toHex (...rest) {
    return this.toBuffer(...rest).toString('hex')
  }

  asyncToHex (...rest) {
    return this.asyncToBuffer(...rest).then(buf => buf.toString('hex'))
  }

  toFastHex (...rest) {
    return this.toFastBuffer(...rest).toString('hex')
  }

  fromString (str, ...rest) {
    if (typeof str !== 'string') {
      throw new Error('str must be a string')
    }
    return this.fromHex(str, ...rest)
  }

  static fromString (str, ...rest) {
    return new this().fromString(str, ...rest)
  }

  asyncFromString (str, ...rest) {
    if (typeof str !== 'string') {
      throw new Error('str must be a string')
    }
    return this.asyncFromHex(str, ...rest)
  }

  static asyncFromString (str, ...rest) {
    return new this().asyncFromString(str, ...rest)
  }

  toString (...rest) {
    return this.toHex(...rest)
  }

  asyncToString (...rest) {
    return this.asyncToHex(...rest)
  }

  fromJSON (json) {
    throw new Error('not implemented')
  }

  static fromJSON (json, ...rest) {
    return new this().fromJSON(json, ...rest)
  }

  asyncFromJSON (json, ...rest) {
    throw new Error('not implemented')
  }

  static asyncFromJSON (json, ...rest) {
    return new this().asyncFromJSON(json, ...rest)
  }

  toJSON () {
    var json = {}
    for (var val in this) {
      // arrays
      if (Array.isArray(this[val])) {
        const arr = []
        for (var i in this[val]) {
          if (typeof this[val][i].toJSON === 'function') {
            arr.push(this[val][i].toJSON())
          } else {
            arr.push(JSON.stringify(this[val][i]))
          }
        }
        json[val] = arr
        // objects
      } else if (this[val] === null) {
        json[val] = this[val]
      } else if (
        typeof this[val] === 'object' &&
          typeof this[val].toJSON === 'function'
      ) {
        json[val] = this[val].toJSON()
        // booleans, numbers, and strings
      } else if (
        typeof this[val] === 'boolean' ||
          typeof this[val] === 'number' ||
          typeof this[val] === 'string'
      ) {
        json[val] = this[val]
        // buffers
      } else if (Buffer.isBuffer(this[val])) {
        json[val] = this[val].toString('hex')
        // map
      } else if (this[val] instanceof Map) {
        json[val] = JSON.stringify(this[val])
        // throw an error for objects that do not implement toJSON
      } else if (typeof this[val] === 'object') {
        throw new Error('not implemented')
      }
    }
    return json
    // throw new Error('not implemented')
  }

  asyncToJSON () {
    throw new Error('not implemented')
  }

  clone () {
    // TODO: Should this be more intelligent about picking which clone method
    // to default to?
    return this.cloneByJSON()
  }

  cloneByBuffer () {
    return new this.constructor().fromBuffer(this.toBuffer())
  }

  cloneByFastBuffer () {
    return new this.constructor().fromFastBuffer(this.toFastBuffer())
  }

  cloneByHex () {
    return new this.constructor().fromHex(this.toHex())
  }

  cloneByString () {
    return new this.constructor().fromString(this.toString())
  }

  cloneByJSON () {
    return new this.constructor().fromJSON(this.toJSON())
  }
}

export { Struct }
