/**
 * WorkersResult
 * =============
 *
 * A response sent back from a worker to the main thread. Contains the "result"
 * of the computation in the form of a buffer, resbuf. If the actual result is
 * an object with a .toFastBuffer method, the object is converted to a buffer
 * using that method. Otherwise it is JSON serialized into a buffer. The result
 * can also be an error, in which case the isError flag is set.
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BW = deps.BW
  let Struct = deps.Struct

  function WorkersResult (resbuf, isError, id) {
    if (!(this instanceof WorkersResult)) {
      return new WorkersResult(resbuf, isError, id)
    }
    this.fromObject({resbuf, isError, id})
  }

  WorkersResult.prototype = Object.create(Struct.prototype)
  WorkersResult.prototype.constructor = WorkersResult

  WorkersResult.prototype.fromResult = function (result, id) {
    if (result.toFastBuffer) {
      this.resbuf = result.toFastBuffer()
    } else {
      this.resbuf = new Buffer(JSON.stringify(result))
    }
    this.isError = false
    this.id = id
    return this
  }

  WorkersResult.prototype.fromError = function (error, id) {
    this.resbuf = new Buffer(JSON.stringify(error.message))
    this.isError = true
    this.id = id
    return this
  }

  WorkersResult.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    bw.writeVarintNum(this.resbuf.length)
    bw.write(this.resbuf)
    bw.writeUInt8(Number(this.isError))
    bw.writeVarintNum(this.id)
    return bw
  }

  WorkersResult.prototype.fromBR = function (br) {
    let resbuflen = br.readVarintNum()
    this.resbuf = br.read(resbuflen)
    this.isError = Boolean(br.readUInt8())
    this.id = br.readVarintNum()
    return this
  }

  return WorkersResult
}

inject = require('./injector')(inject, dependencies)
let WorkersResult = inject()
module.exports = WorkersResult
