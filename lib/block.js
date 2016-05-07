/**
 * Block
 * =====
 *
 * A block, of course, is a collection of transactions. This class is somewhat
 * incomplete at the moment. In the future, it should support the ability to
 * check to see if a transaction is in a block (thanks to the magic of merkle
 * trees). You will probably never use Fullnode to create a block, since almost
 * everyone will use bitcoind for that. As such, the primary way to use this is
 * new Block().fromBuffer(buf), which will parse the block and prepare its insides
 * for you to inspect.
 */
'use strict'
let dependencies = {
  Br: require('./br'),
  Bw: require('./bw'),
  BlockHeader: require('./block-header'),
  Constants: require('./constants').Default.Mainnet,
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

  class Block extends Struct {
    constructor (magicNum, blockSize, blockHeader, txsVi, txs) {
      super()
      this.fromObject({magicNum, blockSize, blockHeader, txsVi, txs})
    }

    fromJson (json) {
      let txs = []
      json.txs.forEach(function (tx) {
        txs.push(new Tx().fromJson(tx))
      })
      this.fromObject({
        magicNum: json.magicNum,
        blockSize: json.blockSize,
        blockHeader: new BlockHeader().fromJson(json.blockHeader),
        txsVi: new VarInt().fromJson(json.txsVi),
        txs: txs
      })
      return this
    }

    toJson () {
      let txs = []
      this.txs.forEach(function (tx) {
        txs.push(tx.toJson())
      })
      return {
        magicNum: this.magicNum,
        blockSize: this.blockSize,
        blockHeader: this.blockHeader.toJson(),
        txsVi: this.txsVi.toJson(),
        txs: txs
      }
    }

    fromBr (br) {
      this.magicNum = br.readUInt32LE()
      this.blockSize = br.readUInt32LE()
      this.blockHeader = new BlockHeader().fromBr(br)
      this.txsVi = new VarInt(br.readVarIntBuf())
      let txslen = this.txsVi.toNumber()
      this.txs = []
      for (let i = 0; i < txslen; i++) {
        this.txs.push(new Tx().fromBr(br))
      }
      return this
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeUInt32LE(this.magicNum)
      bw.writeUInt32LE(this.blockSize)
      bw.write(this.blockHeader.toBuffer())
      bw.write(this.txsVi.buf)
      let txslen = this.txsVi.toNumber()
      for (let i = 0; i < txslen; i++) {
        this.txs[i].toBw(bw)
      }
      return bw
    }

    hash () {
      return Hash.sha256Sha256(this.blockHeader.toBuffer())
    }

    asyncHash () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'hash', [])
        return workersResult.resbuf
      }, this)
    }

    id () {
      return new Br(this.hash()).readReverse()
    }

    asyncId () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'id', [])
        return workersResult.resbuf
      }, this)
    }

    verifyMerkleRoot () {
      let txsbufs = this.txs.map((tx) => tx.toBuffer())
      let merkleRootBuf = Merkle.fromBuffers(txsbufs).hash()
      return Buffer.compare(merkleRootBuf, this.blockHeader.merkleRootBuf)
    }
  }

  Block.MAX_BLOCK_SIZE = 1000000

  return Block
}

inject = require('injecter')(inject, dependencies)
let Block = inject()
Block.Mainnet = inject({
  Constants: require('./constants').Default.Mainnet
})
Block.Testnet = inject({
  Constants: require('./constants').Default.Testnet
})
module.exports = Block
