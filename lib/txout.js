/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * Txout(valuebn, script) (i.e., just as with Txin, you can leave out the
 * scriptvi, since it can be computed automatically.
*/
'use strict'
let dependencies = {
  BN: require('./bn'),
  BW: require('./bw'),
  Script: require('./script'),
  Struct: require('./struct'),
  Varint: require('./varint')
}

let inject = function (deps) {
  let BN = deps.BN
  let BW = deps.BW
  let Script = deps.Script
  let Struct = deps.Struct
  let Varint = deps.Varint

  function Txout (valuebn, scriptvi, script) {
    if (!(this instanceof Txout)) {
      return new Txout(valuebn, scriptvi, script)
    }
    if (valuebn instanceof BN) {
      if (scriptvi instanceof Script) {
        script = scriptvi
        this.fromObject({valuebn})
        this.setScript(script)
      } else {
        this.fromObject({valuebn, scriptvi, script})
      }
    } else if (valuebn) {
      let obj = valuebn
      this.fromObject(obj)
    }
  }

  Txout.prototype = Object.create(Struct.prototype)
  Txout.prototype.constructor = Txout

  Txout.prototype.setScript = function (script) {
    this.scriptvi = Varint(script.toBuffer().length)
    this.script = script
    return this
  }

  Txout.prototype.fromJSON = function (json) {
    this.fromObject({
      valuebn: BN().fromJSON(json.valuebn),
      scriptvi: Varint().fromJSON(json.scriptvi),
      script: Script().fromJSON(json.script)
    })
    return this
  }

  Txout.prototype.toJSON = function () {
    return {
      valuebn: this.valuebn.toJSON(),
      scriptvi: this.scriptvi.toJSON(),
      script: this.script.toJSON()
    }
  }

  Txout.prototype.fromBR = function (br) {
    this.valuebn = br.readUInt64LEBN()
    this.scriptvi = Varint(br.readVarintNum())
    this.script = Script().fromBuffer(br.read(this.scriptvi.toNumber()))
    return this
  }

  Txout.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    bw.writeUInt64LEBN(this.valuebn)
    bw.write(this.scriptvi.buf)
    bw.write(this.script.toBuffer())
    return bw
  }

  return Txout
}

inject = require('./injector')(inject, dependencies)
let Txout = inject()
module.exports = Txout
