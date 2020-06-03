'use strict'
const Random = require('../lib/random')
const net = require('net')
const MsgVersion = require('../lib/msg-version')
const Constants = require('../lib/constants').Default
const Version = require('../lib/version')
const VarInt = require('../lib/var-int')
const Bn = require('../lib/bn')

const client = net.createConnection({ port: 8333, host: '192.168.0.105' }, () => {
  // const hashBuf = Buffer.alloc(32)
  // hashBuf.fill(0)
  // const msgGetBlocks = MsgGetBlocks.fromHashes([hashBuf])
  const versionBytesNum = Constants.Msg.versionBytesNum
  const servicesBuf = Buffer.from('0100000000000000', 'hex')
  const timeBn = Bn(Date.now())
  const addrRecvServicesBuf = Buffer.from('0100000000000000', 'hex')
  const addrRecvIpAddrBuf = Buffer.from([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    255,
    255,
    192,
    168,
    0,
    105
  ])
  const addrRecvPort = 8333
  const addrTransServicesBuf = Buffer.from('0100000000000000', 'hex')
  const addrTransIpAddrBuf = Buffer.from([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    255,
    255,
    192,
    168,
    0,
    103
  ])
  const addrTransPort = 8333
  const nonceBuf = Random.getRandomBuffer(8)
  const userAgentBuf = Buffer.from('/Satoshi:5.64/bitcoin-qt:0.4/')
  const userAgentVi = VarInt.fromNumber(userAgentBuf.length)
  const startHeightNum = 1
  const relay = 1
  const version = new Version(
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
  )
  console.log('here')
  const msgVersion = MsgVersion.fromVersion(version)
  console.log(version)
  console.log(msgVersion)
  const msgBuf = msgVersion.toBuffer()
  client.write(msgBuf)
})

client.on('data', data => {
  console.log('got data')
})

client.on('end', () => {
  console.log('ended')
})
