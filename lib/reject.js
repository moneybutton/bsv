/**
 * Reject
 * =========
 *
 * The data structure used inside the "reject" p2p message. Contains a reason
 * why a particular message was rejected. Useful for debugging.
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Struct: require('./struct'),
  Varint: require('./varint')
}

let inject = function (deps) {
  let BW = deps.BW
  let Struct = deps.Struct
  let Varint = deps.Varint

  function Reject (typevi, typestr, codenum, reasonvi, reasonstr, extrabuf) {
    if (!(this instanceof Reject)) {
      return new Reject(typevi, typestr, codenum, reasonvi, reasonstr, extrabuf)
    }
    this.fromObject({typevi, typestr, codenum, reasonvi, reasonstr, extrabuf})
  }

  Reject.prototype = Object.create(Struct.prototype)
  Reject.prototype.constructor = Reject

  Reject.prototype.toBW = function (bw) {
    if (!bw) {
      bw = BW()
    }
    bw.write(this.typevi.buf)
    bw.write(new Buffer(this.typestr))
    bw.writeUInt8(this.codenum)
    bw.write(this.reasonvi.buf)
    bw.write(new Buffer(this.reasonstr))
    bw.write(this.extrabuf)
    return bw
  }

  Reject.prototype.fromBR = function (br) {
    this.typevi = Varint(br.readVarintBuf())
    this.typestr = br.read(this.typevi.toNumber()).toString()
    this.codenum = br.readUInt8()
    this.reasonvi = Varint(br.readVarintBuf())
    this.reasonstr = br.read(this.reasonvi.toNumber()).toString()
    this.extrabuf = br.read()
    return this
  }

  return Reject
}

inject = require('injecter')(inject, dependencies)
let Reject = inject()
module.exports = Reject
