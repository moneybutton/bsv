/**
 * Hash Cache
 * ==========
 *
 * For use in sighash.
 */
'use strict'

let Struct = require('./struct')

class HashCache extends Struct {
  constructor (hashPrevouts, hashSequence, hashOutputs) {
    super()
    this.fromObject({ hashPrevouts, hashSequence, hashOutputs })
  }

  fromBuffer (buf) {
    return this.fromJSON(JSON.parse(buf.toString()))
  }

  toBuffer () {
    return Buffer.from(JSON.stringify(this.toJSON()))
  }

  fromJSON (json) {
    this.hashPrevouts = json.hashPrevouts ? Buffer.from(json.hashPrevouts, 'hex') : undefined
    this.hashSequence = json.hashSequence ? Buffer.from(json.hashSequence, 'hex') : undefined
    this.hashOutputs = json.hashOutputs ? Buffer.from(json.hashOutputs, 'hex') : undefined
    return this
  }

  toJSON () {
    return {
      hashPrevouts: this.hashPrevouts ? this.hashPrevouts.toString('hex') : undefined,
      hashSequence: this.hashSequence ? this.hashSequence.toString('hex') : undefined,
      hashOutputs: this.hashOutputs ? this.hashOutputs.toString('hex') : undefined
    }
  }
}

module.exports = HashCache
