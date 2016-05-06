/**
 * Reject
 * =========
 *
 * The data structure used inside the "reject" p2p message. Contains a reason
 * why a particular message was rejected. Useful for debugging.
 */
'use strict'
let dependencies = {
  Bw: require('./bw'),
  Struct: require('./struct'),
  VarInt: require('./var-int')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let Struct = deps.Struct
  let VarInt = deps.VarInt

  class Reject extends Struct {
    constructor (typeVi, typeStr, codeNum, reasonVi, reasonStr, extraBuf) {
      super()
      this.fromObject({typeVi, typeStr, codeNum, reasonVi, reasonStr, extraBuf})
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.write(this.typeVi.buf)
      bw.write(new Buffer(this.typeStr))
      bw.writeUInt8(this.codeNum)
      bw.write(this.reasonVi.buf)
      bw.write(new Buffer(this.reasonStr))
      bw.write(this.extraBuf)
      return bw
    }

    fromBr (br) {
      this.typeVi = new VarInt(br.readVarIntBuf())
      this.typeStr = br.read(this.typeVi.toNumber()).toString()
      this.codeNum = br.readUInt8()
      this.reasonVi = new VarInt(br.readVarIntBuf())
      this.reasonStr = br.read(this.reasonVi.toNumber()).toString()
      this.extraBuf = br.read()
      return this
    }
  }

  return Reject
}

inject = require('injecter')(inject, dependencies)
let Reject = inject()
module.exports = Reject
