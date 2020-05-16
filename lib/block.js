/**
 * Block
 * =====
 *
 * A block, of course, is a collection of transactions. This class is somewhat
 * incomplete at the moment. In the future, it should support the ability to
 * check to see if a transaction is in a block (thanks to the magic of merkle
 * trees). You will probably never use Yours Bitcoin to create a block, since almost
 * everyone will use bitcoind for that. As such, the primary way to use this is
 * new Block().fromBuffer(buf), which will parse the block and prepare its insides
 * for you to inspect.
 */
'use strict'

import { Br } from './br'
import { Bw } from './bw'
import { BlockHeader } from './block-header'
import { Hash } from './hash'
import { Merkle } from './merkle'
import { Struct } from './struct'
import { Tx } from './tx'
import { VarInt } from './var-int'
import { Workers } from './workers'

class Block extends Struct {
  constructor (blockHeader, txsVi, txs) {
    super({ blockHeader, txsVi, txs })
  }

  fromJSON (json) {
    let txs = []
    json.txs.forEach(function (tx) {
      txs.push(new Tx().fromJSON(tx))
    })
    this.fromObject({
      blockHeader: new BlockHeader().fromJSON(json.blockHeader),
      txsVi: new VarInt().fromJSON(json.txsVi),
      txs: txs
    })
    return this
  }

  toJSON () {
    let txs = []
    this.txs.forEach(function (tx) {
      txs.push(tx.toJSON())
    })
    return {
      blockHeader: this.blockHeader.toJSON(),
      txsVi: this.txsVi.toJSON(),
      txs: txs
    }
  }

  fromBr (br) {
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

  async asyncHash () {
    let workersResult = await Workers.asyncObjectMethod(this, 'hash', [])
    return workersResult.resbuf
  }

  id () {
    return new Br(this.hash()).readReverse().toString('hex')
  }

  async asyncId () {
    let workersResult = await Workers.asyncObjectMethod(this, 'id', [])
    return JSON.parse(workersResult.resbuf.toString())
  }

  verifyMerkleRoot () {
    let txsbufs = this.txs.map(tx => tx.toBuffer())
    let merkleRootBuf = Merkle.fromBuffers(txsbufs).hash()
    return Buffer.compare(merkleRootBuf, this.blockHeader.merkleRootBuf)
  }
}

Block.MAX_BLOCK_SIZE = 1000000

export { Block }
