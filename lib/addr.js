/**
 * Addr
 * ====
 *
 * An IP address and port. Note that "Addr" is completely different from
 * "Address". Addr is an IP address and port of a bitcoin node on the network
 * for connecting to using the bitcoin p2p protocol. Address is a bitcoin
 * address for sending a payment to.
 */
'use strict'
let dependencies = {
  Bw: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let Struct = deps.Struct

  function Addr (time, servicesbuf, ipaddrbuf, port) {
    if (!(this instanceof Addr)) {
      return new Addr(time, servicesbuf, ipaddrbuf, port)
    }
    this.fromObject({time, servicesbuf, ipaddrbuf, port})
  }

  Addr.prototype = Object.create(Struct.prototype)
  Addr.prototype.constructor = Addr

  Addr.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32LE(this.time) // note LE
    bw.write(this.servicesbuf)
    bw.write(this.ipaddrbuf)
    bw.writeUInt16BE(this.port) // note BE
    return bw
  }

  Addr.prototype.fromBr = function (br) {
    this.time = br.readUInt32LE() // note LE
    this.servicesbuf = br.read(8)
    this.ipaddrbuf = br.read(16)
    this.port = br.readUInt16BE() // note BE
    return this
  }

  return Addr
}

inject = require('injecter')(inject, dependencies)
let Addr = inject()
module.exports = Addr
