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
  Bn: require('./bn'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Br = deps.Br
  let Bw = deps.Bw
  let Bn = deps.Bn
  let Struct = deps.Struct

  function VarInt (buf) {
    if (!(this instanceof VarInt)) {
      return new VarInt(buf)
    }
    if (Buffer.isBuffer(buf)) {
      this.buf = buf
    } else if (typeof buf === 'number') {
      let num = buf
      this.fromNumber(num)
    } else if (buf instanceof Bn) {
      let bn = buf
      this.fromBn(bn)
    } else if (buf) {
      let obj = buf
      this.fromObject(obj)
    }
  }

  VarInt.prototype = Object.create(Struct.prototype)
  VarInt.prototype.constructor = VarInt

  VarInt.prototype.fromJson = function (json) {
    this.fromObject({
      buf: new Buffer(json, 'hex')
    })
    return this
  }

  VarInt.prototype.toJson = function () {
    return this.buf.toString('hex')
  }

  VarInt.prototype.fromBuffer = function (buf) {
    this.buf = buf
    return this
  }

  VarInt.prototype.fromBr = function (br) {
    this.buf = br.readVarIntBuf()
    return this
  }

  VarInt.prototype.fromBn = function (bn) {
    this.buf = new Bw().writeVarIntBn(bn).toBuffer()
    return this
  }

  VarInt.prototype.fromNumber = function (num) {
    this.buf = new Bw().writeVarIntNum(num).toBuffer()
    return this
  }

  VarInt.prototype.toBuffer = function () {
    return this.buf
  }

  VarInt.prototype.toBn = function () {
    return new Br(this.buf).readVarIntBn()
  }

  VarInt.prototype.toNumber = function () {
    return new Br(this.buf).readVarIntNum()
  }

  return VarInt
}

inject = require('injecter')(inject, dependencies)
let VarInt = inject()
module.exports = VarInt
