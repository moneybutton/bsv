/**
 * Block
 * =====
 *
 * A block, of course, is a collection of transactions. This class is somewhat
 * incomplete at the moment. In the future, it should support the ability to
 * check to see if a transaction is in a block (thanks to the magic of merkle
 * trees). You will probably never use fullnode to create a block, since almost
 * everyone will use bitcoind for that. As such, the primary way to use this is
 * Block().fromBuffer(buf), which will parse the block and prepare its insides
 * for you to inspect.
 */
'use strict'
let dependencies = {
  BR: require('./br'),
  BW: require('./bw'),
  Blockheader: require('./blockheader'),
  Constants: require('./constants').Default.Mainnet,
  Hash: require('./hash'),
  Merkle: require('./merkle'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  Varint: require('./varint'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let BR = deps.BR
  let BW = deps.BW
  let Blockheader = deps.Blockheader
  let Hash = deps.Hash
  let Merkle = deps.Merkle
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Varint = deps.Varint
  let Workers = deps.Workers
  let asink = deps.asink

  let Block = function Block (magicnum, blocksize, blockheader, txsvi, txs) {
    if (!(this instanceof Block)) {
      return new Block(magicnum, blocksize, blockheader, txsvi, txs)
    }
    this.fromObject({magicnum, blocksize, blockheader, txsvi, txs})
  }

  Block.prototype = Object.create(Struct.prototype)
  Block.prototype.constructor = Block

  Block.MAX_BLOCK_SIZE = 1000000

  Block.prototype.fromJSON = function (json) {
    let txs = []
    json.txs.forEach(function (tx) {
      txs.push(Tx().fromJSON(tx))
    })
    this.fromObject({
      magicnum: json.magicnum,
      blocksize: json.blocksize,
      blockheader: Blockheader().fromJSON(json.blockheader),
      txsvi: Varint().fromJSON(json.txsvi),
      txs: txs
    })
    return this
  }

  Block.prototype.toJSON = function () {
    let txs = []
    this.txs.forEach(function (tx) {
      txs.push(tx.toJSON())
    })
    return {
      magicnum: this.magicnum,
      blocksize: this.blocksize,
      blockheader: this.blockheader.toJSON(),
      txsvi: this.txsvi.toJSON(),
      txs: txs
    }
  }

  Block.prototype.fromBR = function (br) {
    this.magicnum = br.readUInt32LE()
    this.blocksize = br.readUInt32LE()
    this.blockheader = Blockheader().fromBR(br)
    this.txsvi = Varint(br.readVarintBuf())
    let txslen = this.txsvi.toNumber()
    this.txs = []
    for (let i = 0; i < txslen; i++) {
      this.txs.push(Tx().fromBR(br))
    }
    return this
  }

  Block.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    bw.writeUInt32LE(this.magicnum)
    bw.writeUInt32LE(this.blocksize)
    bw.write(this.blockheader.toBuffer())
    bw.write(this.txsvi.buf)
    let txslen = this.txsvi.toNumber()
    for (let i = 0; i < txslen; i++) {
      this.txs[i].toBW(bw)
    }
    return bw
  }

  Block.prototype.hash = function () {
    return Hash.sha256sha256(this.blockheader.toBuffer())
  }

  Block.prototype.asyncHash = function () {
    return asink(function *() {
      let workersResult = yield Workers.asyncObjectMethod(this, 'hash', [])
      return workersResult.resbuf
    }, this)
  }

  Block.prototype.id = function () {
    return BR(this.hash()).readReverse()
  }

  Block.prototype.asyncId = function () {
    return asink(function *() {
      let workersResult = yield Workers.asyncObjectMethod(this, 'id', [])
      return workersResult.resbuf
    }, this)
  }

  Block.prototype.verifyMerkleRoot = function () {
    let txsbufs = this.txs.map((tx) => tx.toBuffer())
    let merklerootbuf = Merkle().fromBuffers(txsbufs).hash()
    return Buffer.compare(merklerootbuf, this.blockheader.merklerootbuf)
  }

  return Block
}

inject = require('./injector')(inject, dependencies)
let Block = inject()
Block.Mainnet = inject({
  Constants: require('./constants').Default.Mainnet
})
Block.Testnet = inject({
  Constants: require('./constants').Default.Testnet
})
module.exports = Block
