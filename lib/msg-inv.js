/**
 * MsgInv
 * ======
 *
 * Sends an inventory, or list of "inv" structures, i.e. a list of objects that
 * we have.
 */
'use strict'
let dependencies = {
  Br: require('./br'),
  Bw: require('./bw'),
  Inv: require('./inv'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Br = deps.Br
  let Bw = deps.Bw
  let Inv = deps.Inv
  let Msg = deps.Msg

  function MsgInv (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgInv)) {
      return new MsgInv(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgInv.prototype = Object.create(Msg.prototype)
  MsgInv.prototype.constructor = MsgInv

  MsgInv.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('inv')
    return this
  }

  MsgInv.databufFromInvs = function (invs) {
    let bw = Bw()
    bw.writeVarIntNum(invs.length)
    for (let i = 0; i < invs.length; i++) {
      bw.write(invs[i].toBuffer())
    }
    return bw.toBuffer()
  }

  MsgInv.prototype.fromInvs = function (invs) {
    this.setData(MsgInv.databufFromInvs(invs))
    return this
  }

  MsgInv.prototype.asyncFromInvs = function (invs) {
    return this.asyncSetData(MsgInv.databufFromInvs(invs))
  }

  MsgInv.prototype.toInvs = function () {
    let br = Br(this.databuf)
    let len = br.readVarIntNum()
    let invs = []
    for (let i = 0; i < len; i++) {
      let invbuf = br.read(4 + 32)
      let inv = Inv().fromBuffer(invbuf)
      invs.push(inv)
    }
    return invs
  }

  MsgInv.prototype.isValid = function () {
    return this.getCmd() === 'inv'
  }

  return MsgInv
}

inject = require('injecter')(inject, dependencies)
let MsgInv = inject()
MsgInv.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgInv.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgInv
