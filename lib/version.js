/**
 * Version
 * =======
 *
 * This data structure is used to specify details about what version of the
 * p2p network is supported by this or other nodes.
 */
'use strict'

import { Bw } from './bw'
import { Constants as Cst } from './constants'
import { Struct } from './struct'
import { VarInt } from './var-int'

const Constants = Cst.Default

class Version extends Struct {
  constructor (
    versionBytesNum = Constants.Msg.versionBytesNum,
    servicesBuf,
    timeBn,
    addrRecvServicesBuf,
    addrRecvIpAddrBuf,
    addrRecvPort,
    addrTransServicesBuf,
    addrTransIpAddrBuf,
    addrTransPort,
    nonceBuf,
    userAgentVi,
    userAgentBuf,
    startHeightNum,
    relay
  ) {
    super({
      versionBytesNum,
      servicesBuf,
      timeBn,
      addrRecvServicesBuf,
      addrRecvIpAddrBuf,
      addrRecvPort,
      addrTransServicesBuf,
      addrTransIpAddrBuf,
      addrTransPort,
      nonceBuf,
      userAgentVi,
      userAgentBuf,
      startHeightNum,
      relay
    })
  }

  toBw (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32LE(this.versionBytesNum)
    bw.write(this.servicesBuf)
    bw.writeUInt64LEBn(this.timeBn)
    bw.write(this.addrRecvServicesBuf)
    bw.write(this.addrRecvIpAddrBuf)
    bw.writeUInt16BE(this.addrRecvPort) // note BE
    bw.write(this.addrTransServicesBuf)
    bw.write(this.addrTransIpAddrBuf)
    bw.writeUInt16BE(this.addrTransPort) // note BE
    bw.write(this.nonceBuf)
    bw.write(this.userAgentVi.buf)
    bw.write(this.userAgentBuf)
    bw.writeUInt32LE(this.startHeightNum)
    bw.writeUInt8(Number(this.relay))
    return bw
  }

  fromBr (br) {
    this.versionBytesNum = br.readUInt32LE()
    this.servicesBuf = br.read(8)
    this.timeBn = br.readUInt64LEBn()
    this.addrRecvServicesBuf = br.read(8)
    this.addrRecvIpAddrBuf = br.read(16)
    this.addrRecvPort = br.readUInt16BE() // note BE
    this.addrTransServicesBuf = br.read(8)
    this.addrTransIpAddrBuf = br.read(16)
    this.addrTransPort = br.readUInt16BE() // note BE
    this.nonceBuf = br.read(8)
    this.userAgentVi = new VarInt(br.readVarIntBuf())
    this.userAgentBuf = br.read(this.userAgentVi.toNumber())
    this.startHeightNum = br.readUInt32LE()
    this.relay = Boolean(br.readUInt8())
    return this
  }
}

export { Version }
