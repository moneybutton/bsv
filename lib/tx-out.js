/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * new TxOut(valuebn, script) (i.e., just as with TxIn, you can leave out the
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

  function TxOut (valuebn, scriptVi, script) {
    if (!(this instanceof TxOut)) {
      return new TxOut(valuebn, scriptVi, script)
    }
    if (valuebn instanceof Bn) {
      if (scriptVi instanceof Script) {
        script = scriptVi
        this.fromObject({valuebn})
        this.setScript(script)
      } else {
        this.fromObject({valuebn, scriptVi, script})
      }
    } else if (valuebn) {
      let obj = valuebn
      this.fromObject(obj)
    }
  }

  TxOut.prototype = Object.create(Struct.prototype)
  TxOut.prototype.constructor = TxOut

  TxOut.prototype.setScript = function (script) {
    this.scriptVi = new VarInt(script.toBuffer().length)
    this.script = script
    return this
  }

  TxOut.prototype.fromJson = function (json) {
    this.fromObject({
      valuebn: new Bn().fromJson(json.valuebn),
      scriptVi: new VarInt().fromJson(json.scriptVi),
      script: new Script().fromJson(json.script)
    })
    return this
  }

  TxOut.prototype.toJson = function () {
    return {
      valuebn: this.valuebn.toJson(),
      scriptVi: this.scriptVi.toJson(),
      script: this.script.toJson()
    }
  }

  TxOut.prototype.fromBr = function (br) {
    this.valuebn = br.readUInt64LEBn()
    this.scriptVi = new VarInt(br.readVarIntNum())
    this.script = new Script().fromBuffer(br.read(this.scriptVi.toNumber()))
    return this
  }

  TxOut.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt64LEBn(this.valuebn)
    bw.write(this.scriptVi.buf)
    bw.write(this.script.toBuffer())
    return bw
  }

  return TxOut
}

inject = require('injecter')(inject, dependencies)
let TxOut = inject()
module.exports = TxOut
