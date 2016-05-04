/**
 * Inv
 * ===
 *
 * Inventory - used in p2p messages.
 */
'use strict'
let dependencies = {
  Bw: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let Struct = deps.Struct

  function Inv (typenum, hashBuf) {
    if (!(this instanceof Inv)) {
      return new Inv(typenum, hashBuf)
    }
    this.fromObject({typenum, hashBuf})
  }

  Inv.prototype = Object.create(Struct.prototype)
  Inv.prototype.constructor = Inv

  Inv.MSG_TX = 1
  Inv.MSG_BLOCK = 2
  Inv.MSG_FILTERED_BLOCK = 3

  Inv.prototype.fromBr = function (br) {
    this.typenum = br.readUInt32LE()
    this.hashBuf = br.read(32)
    return this
  }

  Inv.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32LE(this.typenum)
    bw.write(this.hashBuf)
    return bw
  }

  Inv.prototype.isTx = function () {
    return this.typenum === Inv.MSG_TX
  }

  Inv.prototype.isBlock = function () {
    return this.typenum === Inv.MSG_BLOCK
  }

  Inv.prototype.isFilteredBlock = function () {
    return this.typenum === Inv.MSG_FILTERED_BLOCK
  }

  return Inv
}

inject = require('injecter')(inject, dependencies)
let Inv = inject()
module.exports = Inv
