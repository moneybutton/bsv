'use strict'
let Blockheader = require('../lib/blockheader')
let BR = require('../lib/br')
let Block = require('../lib/block')
let Tx = require('../lib/tx')
let Varint = require('../lib/varint')

let idhex = '000000000000000003dd2fdbb484d6d9c349d644d8bbb3cbfa5e67f639a465fe'
let idbuf = new Buffer(idhex, 'hex')
// let idbuf = BR(new Buffer(idhex, 'hex'))

let magicnum = 0xd9b4bef9
let blocksize = 999923
let version = 3

let merkleroothex = '1c0d990e63cb54b1895edc94f0112049c46fbe2e3aecf8b4792572b138e626e9'
// let merklerootbuf = new Buffer(merkleroothex, 'hex')
let merklerootbuf = BR(new Buffer(merkleroothex, 'hex')).readReverse()

let time = 1436293147
let nonce = 4210060185

// let bits = BR(new Buffer('1816418e', 'hex')).readUInt32LE()
// let bits = BR(new Buffer('8e411618', 'hex')).readUInt32LE()
let bits = 404111758

let prevblockidhex = '000000000000000006b3c87f903ecbd47197cb8b0bc66480bd913c7d203d466f'
// let prevblockidbuf = new Buffer(prevblockidhex, 'hex')
let prevblockidbuf = BR(new Buffer(prevblockidhex, 'hex')).readReverse()

let txsvi = Varint().fromNumber(2)
let txs = []
txs[0] = Tx().fromHex('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff6403048f05fabe6d6dc8ac2ad599db2ec8f09db87988ab87b4c0f46f1641592ddca6e96fb36e98b57a10000000f09f909fe696b0e8a786e9878ee58fb7e8b79de586a5e78e8be6989f38303134323937e585ace9878c0000000000000000000000000000002fa3ea4c0100f90295000000001976a914c825a1ecf2a6830c4401620c3a16f1995057c2ab88acb37c0140')
txs[1] = Tx().fromHex(require('../test/vectors/largesttx').txhex)

let blockheader = Blockheader(version, prevblockidbuf, merklerootbuf, time, bits, nonce)
let block = Block(magicnum, blocksize, blockheader, txsvi, txs)
console.log(block.toHex())
