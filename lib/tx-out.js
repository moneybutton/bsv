/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * new TxOut(valueBn, script) (i.e., just as with TxIn, you can leave out the
 * scriptVi, since it can be computed automatically.
*/
'use strict'
let dependencies = {
  Bn: require('./bn'),
  Bw: require('./bw'),
  Script: require('./script'),
  Struct: require('./struct'),
  VarInt: require('./var-int')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Bw = deps.Bw
  let Script = deps.Script
  let Struct = deps.Struct
  let VarInt = deps.VarInt

  class TxOut extends Struct {
    constructor (valueBn, scriptVi, script) {
      super({valueBn, scriptVi, script})
    }

    setScript (script) {
      this.scriptVi = VarInt.fromNumber(script.toBuffer().length)
      this.script = script
      return this
    }

    fromProperties (valueBn, script) {
      this.fromObject({valueBn})
      this.setScript(script)
      return this
    }

    static fromProperties (valueBn, script) {
      return new this().fromProperties(valueBn, script)
    }

    fromJson (json) {
      this.fromObject({
        valueBn: new Bn().fromJson(json.valueBn),
        scriptVi: new VarInt().fromJson(json.scriptVi),
        script: new Script().fromJson(json.script)
      })
      return this
    }

    toJson () {
      return {
        valueBn: this.valueBn.toJson(),
        scriptVi: this.scriptVi.toJson(),
        script: this.script.toJson()
      }
    }

    fromBr (br) {
      this.valueBn = br.readUInt64LEBn()
      this.scriptVi = VarInt.fromNumber(br.readVarIntNum())
      this.script = new Script().fromBuffer(br.read(this.scriptVi.toNumber()))
      return this
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeUInt64LEBn(this.valueBn)
      bw.write(this.scriptVi.buf)
      bw.write(this.script.toBuffer())
      return bw
    }
  }

  return TxOut
}

inject = require('injecter')(inject, dependencies)
let TxOut = inject()
module.exports = TxOut
