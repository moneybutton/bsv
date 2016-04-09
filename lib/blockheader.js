/**
 * Block Header
 * ============
 *
 * Every block contains a blockheader. This is probably not something you will
 * personally use, but it's here if you need it.
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BW = deps.BW
  let Struct = deps.Struct

  let Blockheader = function Blockheader (version, prevblockhashbuf, merklerootbuf, time, bits, nonce) {
    if (!(this instanceof Blockheader)) {
      return new Blockheader(version, prevblockhashbuf, merklerootbuf, time, bits, nonce)
    }
    this.fromObject({version, prevblockhashbuf, merklerootbuf, time, bits, nonce})
  }

  Blockheader.prototype = Object.create(Struct.prototype)
  Blockheader.prototype.constructor = Blockheader

  Blockheader.prototype.fromJSON = function (json) {
    this.fromObject({
      version: json.version,
      prevblockhashbuf: new Buffer(json.prevblockhashbuf, 'hex'),
      merklerootbuf: new Buffer(json.merklerootbuf, 'hex'),
      time: json.time,
      bits: json.bits,
      nonce: json.nonce
    })
    return this
  }

  Blockheader.prototype.toJSON = function () {
    return {
      version: this.version,
      prevblockhashbuf: this.prevblockhashbuf.toString('hex'),
      merklerootbuf: this.merklerootbuf.toString('hex'),
      time: this.time,
      bits: this.bits,
      nonce: this.nonce
    }
  }

  Blockheader.prototype.fromBR = function (br) {
    this.version = br.readUInt32LE()
    this.prevblockhashbuf = br.read(32)
    this.merklerootbuf = br.read(32)
    this.time = br.readUInt32LE()
    this.bits = br.readUInt32LE()
    this.nonce = br.readUInt32LE()
    return this
  }

  Blockheader.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    bw.writeUInt32LE(this.version)
    bw.write(this.prevblockhashbuf)
    bw.write(this.merklerootbuf)
    bw.writeUInt32LE(this.time)
    bw.writeUInt32LE(this.bits)
    bw.writeUInt32LE(this.nonce)
    return bw
  }

  return Blockheader
}

inject = require('injecter')(inject, dependencies)
let Blockheader = inject()
module.exports = Blockheader
