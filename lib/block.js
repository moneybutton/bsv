/**
 * Block
 * =====
 *
 * A block, of course, is a collection of transactions. This class is somewhat
 * incomplete at the moment. In the future, it should support the ability to
 * check to see if a transaction is in a block (thanks to the magic of merkle
 * trees). You will probably never use Fullnode to create a block, since almost
 * everyone will use bitcoind for that. As such, the primary way to use this is
 * Block().fromBuffer(buf), which will parse the block and prepare its insides
 * for you to inspect.
 */
'use strict'
let dependencies = {
  Br: require('./br'),
  Bw: require('./bw'),
  BlockHeader: require('./block-header'),
  Constants: require('./constants').Default.MainNet,
  Hash: require('./hash'),
  Merkle: require('./merkle'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  VarInt: require('./var-int'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Br = deps.Br
  let Bw = deps.Bw
  let BlockHeader = deps.BlockHeader
  let Hash = deps.Hash
  let Merkle = deps.Merkle
  let Struct = deps.Struct
  let Tx = deps.Tx
  let VarInt = deps.VarInt
  let Workers = deps.Workers
  let asink = deps.asink

  let Block = function Block (magicnum, blocksize, blockHeader, txsvi, txs) {
    if (!(this instanceof Block)) {
      return new Block(magicnum, blocksize, blockHeader, txsvi, txs)
    }
    this.fromObject({magicnum, blocksize, blockHeader, txsvi, txs})
  }

  Block.prototype = Object.create(Struct.prototype)
  Block.prototype.constructor = Block

  Block.MAX_BLOCK_SIZE = 1000000

  Block.prototype.fromJson = function (json) {
    let txs = []
    json.txs.forEach(function (tx) {
      txs.push(Tx().fromJson(tx))
    })
    this.fromObject({
      magicnum: json.magicnum,
      blocksize: json.blocksize,
      blockHeader: BlockHeader().fromJson(json.blockHeader),
      txsvi: VarInt().fromJson(json.txsvi),
      txs: txs
    })
    return this
  }

  Block.prototype.toJson = function () {
    let txs = []
    this.txs.forEach(function (tx) {
      txs.push(tx.toJson())
    })
    return {
      magicnum: this.magicnum,
      blocksize: this.blocksize,
      blockHeader: this.blockHeader.toJson(),
      txsvi: this.txsvi.toJson(),
      txs: txs
    }
  }

  Block.prototype.fromBr = function (br) {
    this.magicnum = br.readUInt32LE()
    this.blocksize = br.readUInt32LE()
    this.blockHeader = BlockHeader().fromBr(br)
    this.txsvi = VarInt(br.readVarIntBuf())
    let txslen = this.txsvi.toNumber()
    this.txs = []
    for (let i = 0; i < txslen; i++) {
      this.txs.push(Tx().fromBr(br))
    }
    return this
  }

  Block.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32LE(this.magicnum)
    bw.writeUInt32LE(this.blocksize)
    bw.write(this.blockHeader.toBuffer())
    bw.write(this.txsvi.buf)
    let txslen = this.txsvi.toNumber()
    for (let i = 0; i < txslen; i++) {
      this.txs[i].toBw(bw)
    }
    return bw
  }

  Block.prototype.hash = function () {
    return Hash.sha256sha256(this.blockHeader.toBuffer())
  }

  Block.prototype.asyncHash = function () {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'hash', [])
      return workersResult.resbuf
    }, this)
  }

  Block.prototype.id = function () {
    return Br(this.hash()).readReverse()
  }

  Block.prototype.asyncId = function () {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'id', [])
      return workersResult.resbuf
    }, this)
  }

  Block.prototype.verifyMerkleRoot = function () {
    let txsbufs = this.txs.map((tx) => tx.toBuffer())
    let merklerootbuf = Merkle().fromBuffers(txsbufs).hash()
    return Buffer.compare(merklerootbuf, this.blockHeader.merklerootbuf)
  }

  return Block
}

inject = require('injecter')(inject, dependencies)
let Block = inject()
Block.MainNet = inject({
  Constants: require('./constants').Default.MainNet
})
Block.TestNet = inject({
  Constants: require('./constants').Default.TestNet
})
module.exports = Block
