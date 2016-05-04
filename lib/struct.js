/**
 * Structure
 * =========
 *
 * A convenient structure to extend objects from that comes with very common
 * boiler plate methods:
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
 * - fromJson
 * - toJson
 */
'use strict'
let dependencies = {
  Br: require('./br'),
  Bw: require('./bw')
}

let inject = function (deps) {
  let Br = deps.Br
  let Bw = deps.Bw

  class Struct {

    fromObject (obj) {
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

    fromBr (br) {
      if (!(br instanceof Br)) {
        throw new Error('br must be a buffer reader')
      }
      throw new Error('not implemented')
    }

    toBw (bw) {
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
      let bw = new Bw()
      let gotlen = 0
      if (startbuf) {
        bw.write(startbuf)
        gotlen += startbuf.length
      }
      let remainderbuf
      while (gotlen < len) {
        let remainderlen = (len - gotlen)
        buf = yield remainderlen
        if (!buf) {
          continue
        }
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

    /**
     * Convert a buffer into an object, i.e. deserialize the object.
     */
    fromBuffer (buf, ...rest) {
      if (!Buffer.isBuffer(buf)) {
        throw new Error('buf must be a buffer')
      }
      let br = new Br(buf)
      let args = [br].concat(rest)
      return this.fromBr.apply(this, args)
    }

    /**
     * The complement of toFastBuffer - see description for toFastBuffer
     */
    fromFastBuffer (buf) {
      if (buf.length === 0) {
        return this
      } else {
        return this.fromBuffer.apply(this, arguments)
      }
    }

    /**
     * Convert the object into a buffer, i.e. serialize the object. This method
     * may block the main thread.
     */
    toBuffer (...rest) {
      return this.toBw.apply(this, rest).toBuffer()
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
    toFastBuffer () {
      if (Object.keys(this).length === 0) {
        return new Buffer(0)
      } else {
        return this.toBuffer.apply(this, arguments)
      }
    }

    fromHex (hex, ...rest) {
      let buf
      try {
        buf = new Buffer(hex, 'hex')
      } catch (e) {
        throw new Error('invalid hex string')
      }
      let args = [buf].concat(rest)
      return this.fromBuffer.apply(this, args)
    }

    fromFastHex (hex, ...rest) {
      let buf
      try {
        buf = new Buffer(hex, 'hex')
      } catch (e) {
        throw new Error('invalid hex string')
      }
      let args = [buf].concat(rest)
      return this.fromFastBuffer.apply(this, args)
    }

    toHex () {
      return this.toBuffer.apply(this, arguments).toString('hex')
    }

    toFastHex () {
      return this.toFastBuffer.apply(this, arguments).toString('hex')
    }

    fromString (str) {
      if (typeof str !== 'string') {
        throw new Error('str must be a string')
      }
      return this.fromHex.apply(this, arguments)
    }

    toString () {
      return this.toHex.apply(this, arguments)
    }

    fromJson (json) {
      throw new Error('not implemented')
    }

    toJson () {
      throw new Error('not implemented')
    }
  }

  return Struct
}

inject = require('injecter')(inject, dependencies)
let Struct = inject()
module.exports = Struct
