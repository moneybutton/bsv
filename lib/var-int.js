/**
 * VarInt (a.k.a. Compact Size)
 * ============================
 *
 * A varInt is a varible sized integer, and it is a format that is unique to
 * bitcoin, and used throughout bitcoin to represent the length of binary data
 * in a compact format that can take up as little as 1 byte or as much as 9
 * bytes.
 */
'use strict'
let dependencies = {
  Br: require('./br'),
  Bw: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Br = deps.Br
  let Bw = deps.Bw
  let Struct = deps.Struct

  class VarInt extends Struct {
    constructor (buf) {
      super({buf})
    }

    fromJson (json) {
      this.fromObject({
        buf: new Buffer(json, 'hex')
      })
      return this
    }

    toJson () {
      return this.buf.toString('hex')
    }

    fromBuffer (buf) {
      this.buf = buf
      return this
    }

    fromBr (br) {
      this.buf = br.readVarIntBuf()
      return this
    }

    fromBn (bn) {
      this.buf = new Bw().writeVarIntBn(bn).toBuffer()
      return this
    }

    static fromBn (bn) {
      return new this().fromBn(bn)
    }

    fromNumber (num) {
      this.buf = new Bw().writeVarIntNum(num).toBuffer()
      return this
    }

    static fromNumber (num) {
      return new this().fromNumber(num)
    }

    toBuffer () {
      return this.buf
    }

    toBn () {
      return new Br(this.buf).readVarIntBn()
    }

    toNumber () {
      return new Br(this.buf).readVarIntNum()
    }
  }

  return VarInt
}

inject = require('injecter')(inject, dependencies)
let VarInt = inject()
module.exports = VarInt
