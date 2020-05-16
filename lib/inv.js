/**
 * Inv
 * ===
 *
 * Inventory - used in p2p messages.
 */
'use strict'

import { Bw } from './bw'
import { Struct } from './struct'

class Inv extends Struct {
  constructor (typeNum, hashBuf) {
    super({ typeNum, hashBuf })
  }

  fromBr (br) {
    this.typeNum = br.readUInt32LE()
    this.hashBuf = br.read(32)
    return this
  }

  toBw (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32LE(this.typeNum)
    bw.write(this.hashBuf)
    return bw
  }

  isTx () {
    return this.typeNum === Inv.MSG_TX
  }

  isBlock () {
    return this.typeNum === Inv.MSG_BLOCK
  }

  isFilteredBlock () {
    return this.typeNum === Inv.MSG_FILTERED_BLOCK
  }
}

Inv.MSG_TX = 1
Inv.MSG_BLOCK = 2
Inv.MSG_FILTERED_BLOCK = 3

export { Inv }
