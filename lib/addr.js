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

  class Addr extends Struct {
    constructor (time, servicesbuf, ipaddrbuf, port) {
      super()
      this.fromObject({time, servicesbuf, ipaddrbuf, port})
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeUInt32LE(this.time) // note LE
      bw.write(this.servicesbuf)
      bw.write(this.ipaddrbuf)
      bw.writeUInt16BE(this.port) // note BE
      return bw
    }

    fromBr (br) {
      this.time = br.readUInt32LE() // note LE
      this.servicesbuf = br.read(8)
      this.ipaddrbuf = br.read(16)
      this.port = br.readUInt16BE() // note BE
      return this
    }
  }

  return Addr
}

inject = require('injecter')(inject, dependencies)
let Addr = inject()
module.exports = Addr
