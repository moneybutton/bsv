'use strict'
let Random = require('../lib/random')
let net = require('net')
let MsgVersion = require('../lib/msg-version')
let Constants = require('../lib/constants').Default
let Version = require('../lib/version')
let VarInt = require('../lib/var-int')
let Bn = require('../lib/bn')

let client = net.createConnection({ port: 8333, host: '192.168.0.105' }, () => {
  // let hashBuf = Buffer.alloc(32)
  // hashBuf.fill(0)
  // let msgGetBlocks = MsgGetBlocks.fromHashes([hashBuf])
  let versionBytesNum = Constants.Msg.versionBytesNum
  let servicesBuf = Buffer.from('0100000000000000', 'hex')
  let timeBn = Bn(Date.now())
  let addrRecvServicesBuf = Buffer.from('0100000000000000', 'hex')
  let addrRecvIpAddrBuf = Buffer.from([
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
  let addrRecvPort = 8333
  let addrTransServicesBuf = Buffer.from('0100000000000000', 'hex')
  let addrTransIpAddrBuf = Buffer.from([
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
  let addrTransPort = 8333
  let nonceBuf = Random.getRandomBuffer(8)
  let userAgentBuf = Buffer.from('/Satoshi:5.64/bitcoin-qt:0.4/')
  let userAgentVi = VarInt.fromNumber(userAgentBuf.length)
  let startHeightNum = 1
  let relay = 1
  let version = new Version(
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
  let msgVersion = MsgVersion.fromVersion(version)
  console.log(version)
  console.log(msgVersion)
  let msgBuf = msgVersion.toBuffer()
  client.write(msgBuf)
})

client.on('data', data => {
  console.log('got data')
})

client.on('end', () => {
  console.log('ended')
})
