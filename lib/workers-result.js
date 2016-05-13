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
  Bw: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let Struct = deps.Struct

  class WorkersResult extends Struct {
    constructor (resbuf, isError, id) {
      super({resbuf, isError, id})
    }

    fromResult (result, id) {
      if (result.toFastBuffer) {
        this.resbuf = result.toFastBuffer()
      } else if (Buffer.isBuffer(result)) {
        this.resbuf = result
      } else {
        this.resbuf = new Buffer(JSON.stringify(result))
      }
      this.isError = false
      this.id = id
      return this
    }

    static fromResult (result, id) {
      return new this().fromResult(result, id)
    }

    fromError (error, id) {
      this.resbuf = new Buffer(JSON.stringify(error.message))
      this.isError = true
      this.id = id
      return this
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeVarIntNum(this.resbuf.length)
      bw.write(this.resbuf)
      bw.writeUInt8(Number(this.isError))
      bw.writeVarIntNum(this.id)
      return bw
    }

    fromBr (br) {
      let resbuflen = br.readVarIntNum()
      this.resbuf = br.read(resbuflen)
      this.isError = Boolean(br.readUInt8())
      this.id = br.readVarIntNum()
      return this
    }
  }

  return WorkersResult
}

inject = require('injecter')(inject, dependencies)
let WorkersResult = inject()
module.exports = WorkersResult
