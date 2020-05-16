/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * new TxOut(valueBn, script) (i.e., just as with TxIn, you can leave out the
 * scriptVi, since it can be computed automatically.
 */
'use strict'

import { Bn } from './bn'
import { Bw } from './bw'
import { Script } from './script'
import { Struct } from './struct'
import { VarInt } from './var-int'

class TxOut extends Struct {
  constructor (valueBn, scriptVi, script) {
    super({ valueBn, scriptVi, script })
  }

  setScript (script) {
    this.scriptVi = VarInt.fromNumber(script.toBuffer().length)
    this.script = script
    return this
  }

  fromProperties (valueBn, script) {
    this.fromObject({ valueBn })
    this.setScript(script)
    return this
  }

  static fromProperties (valueBn, script) {
    return new this().fromProperties(valueBn, script)
  }

  fromJSON (json) {
    this.fromObject({
      valueBn: new Bn().fromJSON(json.valueBn),
      scriptVi: new VarInt().fromJSON(json.scriptVi),
      script: new Script().fromJSON(json.script)
    })
    return this
  }

  toJSON () {
    return {
      valueBn: this.valueBn.toJSON(),
      scriptVi: this.scriptVi.toJSON(),
      script: this.script.toJSON()
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

export { TxOut }
