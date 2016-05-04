/**
 * Peer-to-Peer Network Message
 * ============================
 *
 * A message on the bitcoin p2p network.
 */
'use strict'
let dependencies = {
  Br: require('./br'),
  Bw: require('./bw'),
  Constants: require('./constants').Default,
  Hash: require('./hash'),
  Struct: require('./struct'),
  asink: require('asink'),
  cmp: require('./cmp')
}

let inject = function (deps) {
  let Br = deps.Br
  let Bw = deps.Bw
  let Constants = deps.Constants
  let Hash = deps.Hash
  let Struct = deps.Struct
  let asink = deps.asink
  let cmp = deps.cmp

  function Msg (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof Msg)) {
      return new Msg(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  Msg.prototype = Object.create(Struct.prototype)
  Msg.prototype.constructor = Msg

  Msg.prototype.initialize = function () {
    this.magicnum = Constants.Msg.magicnum
    return this
  }

  Msg.prototype.setCmd = function (cmdname) {
    this.cmdbuf = new Buffer(12)
    this.cmdbuf.fill(0)
    this.cmdbuf.write(cmdname)
    return this
  }

  Msg.prototype.getCmd = function () {
    let end = this.cmdbuf.length
    for (let i = end; i > 0; i--) {
      if (this.cmdbuf[i - 1] !== 0) {
        end = i
        break
      }
    }
    return this.cmdbuf.toString('utf8', 0, end)
  }

  Msg.checksum = function (databuf) {
    return Hash.sha256sha256(databuf).slice(0, 4)
  }

  Msg.asyncChecksum = function (databuf) {
    return asink(function * () {
      let hashBuf = yield Hash.asyncSha256sha256(databuf)
      return hashBuf.slice(0, 4)
    }, this)
  }

  Msg.prototype.setData = function (databuf) {
    this.databuf = databuf
    this.datasize = databuf.length
    this.checksumbuf = Msg.checksum(databuf)
    return this
  }

  Msg.prototype.asyncSetData = function (databuf) {
    return asink(function * () {
      this.databuf = databuf
      this.datasize = databuf.length
      this.checksumbuf = yield Msg.asyncChecksum(databuf)
      return this
    }, this)
  }

  /**
   * An iterator to produce a message from a series of buffers. Set opts.strict
   * to throw an error if an invalid message occurs in stream.
   */
  Msg.prototype.genFromBuffers = function * (opts) {
    opts = opts === undefined ? {} : opts
    let res
    res = yield * this.expect(4)
    this.magicnum = new Br(res.buf).readUInt32BE()
    if (opts.strict && this.magicnum !== Constants.Msg.magicnum) {
      throw new Error('invalid magicnum')
    }
    res = yield * this.expect(12, res.remainderbuf)
    this.cmdbuf = new Br(res.buf).read(12)
    res = yield * this.expect(4, res.remainderbuf)
    this.datasize = new Br(res.buf).readUInt32BE()
    if (opts.strict && this.datasize > Constants.maxsize) {
      throw new Error('message size greater than maxsize')
    }
    res = yield * this.expect(4, res.remainderbuf)
    this.checksumbuf = new Br(res.buf).read(4)
    res = yield * this.expect(this.datasize, res.remainderbuf)
    this.databuf = new Br(res.buf).read(this.datasize)
    return res.remainderbuf
  }

  Msg.prototype.fromBr = function (br) {
    this.magicnum = br.readUInt32BE()
    this.cmdbuf = br.read(12)
    this.datasize = br.readUInt32BE()
    this.checksumbuf = br.read(4)
    this.databuf = br.read()
    return this
  }

  Msg.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32BE(this.magicnum)
    bw.write(this.cmdbuf)
    bw.writeUInt32BE(this.datasize)
    bw.write(this.checksumbuf)
    bw.write(this.databuf)
    return bw
  }

  Msg.prototype.fromJson = function (json) {
    this.magicnum = json.magicnum
    this.cmdbuf = new Buffer(json.cmdbuf, 'hex')
    this.datasize = json.datasize
    this.checksumbuf = new Buffer(json.checksumbuf, 'hex')
    this.databuf = new Buffer(json.databuf, 'hex')
    return this
  }

  Msg.prototype.toJson = function () {
    return {
      magicnum: this.magicnum,
      cmdbuf: this.cmdbuf.toString('hex'),
      datasize: this.datasize,
      checksumbuf: this.checksumbuf.toString('hex'),
      databuf: this.databuf.toString('hex')
    }
  }

  Msg.prototype.isValid = function () {
    // TODO: Add more checks
    let checksumbuf = Msg.checksum(this.databuf)
    return cmp(checksumbuf, this.checksumbuf)
  }

  Msg.prototype.asyncIsValid = function () {
    return asink(function * () {
      // TODO: Add more checks
      let checksumbuf = yield Msg.asyncChecksum(this.databuf)
      return cmp(checksumbuf, this.checksumbuf)
    }, this)
  }

  Msg.prototype.validate = function () {
    if (!this.isValid()) {
      throw new Error('invalid message')
    }
    return this
  }

  Msg.prototype.asyncValidate = function () {
    return asink(function * () {
      let isValid = yield this.asyncIsValid()
      if (isValid !== true) {
        throw new Error('invalid message')
      }
    }, this)
  }

  return Msg
}

inject = require('injecter')(inject, dependencies)
let Msg = inject()
Msg.MainNet = inject({
  Constants: require('./constants').MainNet
})
Msg.TestNet = inject({
  Constants: require('./constants').TestNet
})
module.exports = Msg
