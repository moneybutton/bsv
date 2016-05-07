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

  class Msg extends Struct {
    constructor (magicNum, cmdbuf, datasize, checksumbuf, dataBuf) {
      super()
      this.initialize()
      this.fromObject({magicNum, cmdbuf, datasize, checksumbuf, dataBuf})
    }

    initialize () {
      this.magicNum = Constants.Msg.magicNum
      return this
    }

    setCmd (cmdname) {
      this.cmdbuf = new Buffer(12)
      this.cmdbuf.fill(0)
      this.cmdbuf.write(cmdname)
      return this
    }

    getCmd () {
      let end = this.cmdbuf.length
      for (let i = end; i > 0; i--) {
        if (this.cmdbuf[i - 1] !== 0) {
          end = i
          break
        }
      }
      return this.cmdbuf.toString('utf8', 0, end)
    }

    static checksum (dataBuf) {
      return Hash.sha256Sha256(dataBuf).slice(0, 4)
    }

    static asyncChecksum (dataBuf) {
      return asink(function * () {
        let hashBuf = yield Hash.asyncSha256Sha256(dataBuf)
        return hashBuf.slice(0, 4)
      }, this)
    }

    setData (dataBuf) {
      this.dataBuf = dataBuf
      this.datasize = dataBuf.length
      this.checksumbuf = Msg.checksum(dataBuf)
      return this
    }

    asyncSetData (dataBuf) {
      return asink(function * () {
        this.dataBuf = dataBuf
        this.datasize = dataBuf.length
        this.checksumbuf = yield Msg.asyncChecksum(dataBuf)
        return this
      }, this)
    }

    /**
     * An iterator to produce a message from a series of buffers. Set opts.strict
     * to throw an error if an invalid message occurs in stream.
     */
    * genFromBuffers (opts) {
      opts = opts === undefined ? {} : opts
      let res
      res = yield * this.expect(4)
      this.magicNum = new Br(res.buf).readUInt32BE()
      if (opts.strict && this.magicNum !== Constants.Msg.magicNum) {
        throw new Error('invalid magicNum')
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
      this.dataBuf = new Br(res.buf).read(this.datasize)
      return res.remainderbuf
    }

    fromBr (br) {
      this.magicNum = br.readUInt32BE()
      this.cmdbuf = br.read(12)
      this.datasize = br.readUInt32BE()
      this.checksumbuf = br.read(4)
      this.dataBuf = br.read()
      return this
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeUInt32BE(this.magicNum)
      bw.write(this.cmdbuf)
      bw.writeUInt32BE(this.datasize)
      bw.write(this.checksumbuf)
      bw.write(this.dataBuf)
      return bw
    }

    fromJson (json) {
      this.magicNum = json.magicNum
      this.cmdbuf = new Buffer(json.cmdbuf, 'hex')
      this.datasize = json.datasize
      this.checksumbuf = new Buffer(json.checksumbuf, 'hex')
      this.dataBuf = new Buffer(json.dataBuf, 'hex')
      return this
    }

    toJson () {
      return {
        magicNum: this.magicNum,
        cmdbuf: this.cmdbuf.toString('hex'),
        datasize: this.datasize,
        checksumbuf: this.checksumbuf.toString('hex'),
        dataBuf: this.dataBuf.toString('hex')
      }
    }

    isValid () {
      // TODO: Add more checks
      let checksumbuf = Msg.checksum(this.dataBuf)
      return cmp(checksumbuf, this.checksumbuf)
    }

    asyncIsValid () {
      return asink(function * () {
        // TODO: Add more checks
        let checksumbuf = yield Msg.asyncChecksum(this.dataBuf)
        return cmp(checksumbuf, this.checksumbuf)
      }, this)
    }

    validate () {
      if (!this.isValid()) {
        throw new Error('invalid message')
      }
      return this
    }

    asyncValidate () {
      return asink(function * () {
        let isValid = yield this.asyncIsValid()
        if (isValid !== true) {
          throw new Error('invalid message')
        }
      }, this)
    }
  }

  return Msg
}

inject = require('injecter')(inject, dependencies)
let Msg = inject()
Msg.Mainnet = inject({
  Constants: require('./constants').Mainnet
})
Msg.Testnet = inject({
  Constants: require('./constants').Testnet
})
module.exports = Msg
