/**
 * Hash Cache
 * ==========
 *
 * For use in sighash.
 */
'use strict'

import { Struct } from './struct'

class HashCache extends Struct {
  constructor (prevoutsHashBuf, sequenceHashBuf, outputsHashBuf) {
    super()
    this.fromObject({ prevoutsHashBuf, sequenceHashBuf, outputsHashBuf })
  }

  fromBuffer (buf) {
    return this.fromJSON(JSON.parse(buf.toString()))
  }

  toBuffer () {
    return Buffer.from(JSON.stringify(this.toJSON()))
  }

  fromJSON (json) {
    this.prevoutsHashBuf = json.prevoutsHashBuf ? Buffer.from(json.prevoutsHashBuf, 'hex') : undefined
    this.sequenceHashBuf = json.sequenceHashBuf ? Buffer.from(json.sequenceHashBuf, 'hex') : undefined
    this.outputsHashBuf = json.outputsHashBuf ? Buffer.from(json.outputsHashBuf, 'hex') : undefined
    return this
  }

  toJSON () {
    return {
      prevoutsHashBuf: this.prevoutsHashBuf ? this.prevoutsHashBuf.toString('hex') : undefined,
      sequenceHashBuf: this.sequenceHashBuf ? this.sequenceHashBuf.toString('hex') : undefined,
      outputsHashBuf: this.outputsHashBuf ? this.outputsHashBuf.toString('hex') : undefined
    }
  }
}

export { HashCache }
