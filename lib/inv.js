/**
 * Inv
 * ===
 *
 * Inventory - used in p2p messages.
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BW = deps.BW
  let Struct = deps.Struct

  function Inv (typenum, hashbuf) {
    if (!(this instanceof Inv)) {
      return new Inv(typenum, hashbuf)
    }
    this.fromObject({typenum, hashbuf})
  }

  Inv.prototype = Object.create(Struct.prototype)
  Inv.prototype.constructor = Inv

  Inv.MSG_TX = 1
  Inv.MSG_BLOCK = 2
  Inv.MSG_FILTERED_BLOCK = 3

  Inv.prototype.fromBR = function (br) {
    this.typenum = br.readUInt32BE()
    this.hashbuf = br.read(32)
    return this
  }

  Inv.prototype.toBW = function (bw) {
    if (!bw) {
      bw = BW()
    }
    bw.writeUInt32BE(this.typenum)
    bw.write(this.hashbuf)
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
