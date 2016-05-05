/**
 * MsgAddr
 * ======
 *
 * Sends a a list of addrs (IP addresses) of nodes we are connected to.
 */
'use strict'
let dependencies = {
  Addr: require('./addr'),
  Br: require('./br'),
  Bw: require('./bw'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Addr = deps.Addr
  let Br = deps.Br
  let Bw = deps.Bw
  let Msg = deps.Msg

  class MsgAddr extends Msg {
    constructor (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
      super(magicnum, cmdbuf, datasize, checksumbuf, databuf)
      this.initialize()
      this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
    }

    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('addr')
      return this
    }

    static databufFromAddrs (addrs) {
      let bw = new Bw()
      bw.writeVarIntNum(addrs.length)
      for (let i = 0; i < addrs.length; i++) {
        bw.write(addrs[i].toBuffer())
      }
      return bw.toBuffer()
    }

    fromAddrs (addrs) {
      this.setData(MsgAddr.databufFromAddrs(addrs))
      return this
    }

    static fromAddrs (addrs) {
      return new this().fromAddrs(addrs)
    }

    asyncFromAddrs (addrs) {
      return this.asyncSetData(MsgAddr.databufFromAddrs(addrs))
    }

    static asyncFromAddrs (addrs) {
      return new this().asyncFromAddrs(addrs)
    }

    toAddrs () {
      let br = new Br(this.databuf)
      let len = br.readVarIntNum()
      let addrs = []
      for (let i = 0; i < len; i++) {
        let addrbuf = br.read(4 + 8 + 16 + 2)
        let addr = new Addr().fromBuffer(addrbuf)
        addrs.push(addr)
      }
      return addrs
    }

    isValid () {
      return this.getCmd() === 'addr'
    }
  }

  return MsgAddr
}

inject = require('injecter')(inject, dependencies)
let MsgAddr = inject()
MsgAddr.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgAddr.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgAddr
