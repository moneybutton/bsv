/* global describe,it */
'use strict'
let Br = require('../lib/br')
let Bw = require('../lib/bw')
let Block = require('../lib/block')
let BlockHeader = require('../lib/block-header')
let Tx = require('../lib/tx')
let VarInt = require('../lib/var-int')
let largesttxblockvector = require('./vectors/largesttxblock')
let should = require('should')

describe('Block', function () {
  // let txidhex = '8c9aa966d35bfeaf031409e0001b90ccdafd8d859799eb945a3c515b8260bcf2'
  let txhex =
    '01000000029e8d016a7b0dc49a325922d05da1f916d1e4d4f0cb840c9727f3d22ce8d1363f000000008c493046022100e9318720bee5425378b4763b0427158b1051eec8b08442ce3fbfbf7b30202a44022100d4172239ebd701dae2fbaaccd9f038e7ca166707333427e3fb2a2865b19a7f27014104510c67f46d2cbb29476d1f0b794be4cb549ea59ab9cc1e731969a7bf5be95f7ad5e7f904e5ccf50a9dc1714df00fbeb794aa27aaff33260c1032d931a75c56f2ffffffffa3195e7a1ab665473ff717814f6881485dc8759bebe97e31c301ffe7933a656f020000008b48304502201c282f35f3e02a1f32d2089265ad4b561f07ea3c288169dedcf2f785e6065efa022100e8db18aadacb382eed13ee04708f00ba0a9c40e3b21cf91da8859d0f7d99e0c50141042b409e1ebbb43875be5edde9c452c82c01e3903d38fa4fd89f3887a52cb8aea9dc8aec7e2c9d5b3609c03eb16259a2537135a1bf0f9c5fbbcbdbaf83ba402442ffffffff02206b1000000000001976a91420bb5c3bfaef0231dc05190e7f1c8e22e098991e88acf0ca0100000000001976a9149e3e2d23973a04ec1b02be97c30ab9f2f27c3b2c88ac00000000'
  let txbuf = Buffer.from(txhex, 'hex')
  let magicNum = 0xd9b4bef9
  let blockSize = 50
  let bhhex =
    '0100000005050505050505050505050505050505050505050505050505050505050505050909090909090909090909090909090909090909090909090909090909090909020000000300000004000000'
  let bhbuf = Buffer.from(bhhex, 'hex')
  let bh = new BlockHeader().fromBuffer(bhbuf)
  let txsVi = VarInt.fromNumber(1)
  let txs = [new Tx().fromBuffer(txbuf)]
  let block = new Block().fromObject({
    magicNum: magicNum,
    blockSize: blockSize,
    blockHeader: bh,
    txsVi: txsVi,
    txs: txs
  })
  let blockhex =
    '01000000050505050505050505050505050505050505050505050505050505050505050509090909090909090909090909090909090909090909090909090909090909090200000003000000040000000101000000029e8d016a7b0dc49a325922d05da1f916d1e4d4f0cb840c9727f3d22ce8d1363f000000008c493046022100e9318720bee5425378b4763b0427158b1051eec8b08442ce3fbfbf7b30202a44022100d4172239ebd701dae2fbaaccd9f038e7ca166707333427e3fb2a2865b19a7f27014104510c67f46d2cbb29476d1f0b794be4cb549ea59ab9cc1e731969a7bf5be95f7ad5e7f904e5ccf50a9dc1714df00fbeb794aa27aaff33260c1032d931a75c56f2ffffffffa3195e7a1ab665473ff717814f6881485dc8759bebe97e31c301ffe7933a656f020000008b48304502201c282f35f3e02a1f32d2089265ad4b561f07ea3c288169dedcf2f785e6065efa022100e8db18aadacb382eed13ee04708f00ba0a9c40e3b21cf91da8859d0f7d99e0c50141042b409e1ebbb43875be5edde9c452c82c01e3903d38fa4fd89f3887a52cb8aea9dc8aec7e2c9d5b3609c03eb16259a2537135a1bf0f9c5fbbcbdbaf83ba402442ffffffff02206b1000000000001976a91420bb5c3bfaef0231dc05190e7f1c8e22e098991e88acf0ca0100000000001976a9149e3e2d23973a04ec1b02be97c30ab9f2f27c3b2c88ac00000000'
  let blockBuf = Buffer.from(blockhex, 'hex')

  let genesishex =
    '0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c0101000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000'
  let genesisbuf = Buffer.from(genesishex, 'hex')
  let genesisidhex =
    '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'

  it('should make a new block', function () {
    let block = new Block()
    should.exist(block)
    block = new Block()
    should.exist(block)
  })

  describe('#fromObject', function () {
    it('should set these known values', function () {
      let block = new Block().fromObject({
        magicNum: magicNum,
        blockSize: blockSize,
        blockHeader: bh,
        txsVi: txsVi,
        txs: txs
      })
      should.exist(block.magicNum)
      should.exist(block.blockSize)
      should.exist(block.blockHeader)
      should.exist(block.txsVi)
      should.exist(block.txs)
    })
  })

  describe('#fromJSON', function () {
    it('should set these known values', function () {
      let block = new Block().fromJSON({
        magicNum: magicNum,
        blockSize: blockSize,
        blockHeader: bh.toJSON(),
        txsVi: txsVi.toJSON(),
        txs: [txs[0].toJSON()]
      })
      should.exist(block.blockHeader)
      should.exist(block.txsVi)
      should.exist(block.txs)
    })
  })

  describe('#toJSON', function () {
    it('should recover these known values', function () {
      let json = block.toJSON()
      should.exist(json.blockHeader)
      should.exist(json.txsVi)
      should.exist(json.txs)
    })
  })

  describe('#fromHex', function () {
    it('should make a block from this known hex', function () {
      let block = new Block().fromHex(blockhex)
      block
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
    })
  })

  describe('#fromBuffer', function () {
    it('should make a block from this known buffer', function () {
      let block = new Block().fromBuffer(blockBuf)
      block
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
    })
  })

  describe('#fromBr', function () {
    it('should make a block from this known buffer', function () {
      let block = new Block().fromBr(new Br(blockBuf))
      block
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
    })
  })

  describe('#toHex', function () {
    it('should recover a block from this known hex', function () {
      let block = new Block().fromHex(blockhex)
      block
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
    })
  })

  describe('#toBuffer', function () {
    it('should recover a block from this known buffer', function () {
      let block = new Block().fromBuffer(blockBuf)
      block
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
    })
  })

  describe('#toBw', function () {
    it('should recover a block from this known buffer', function () {
      let block = new Block().fromBuffer(blockBuf)
      block
        .toBw()
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
      let bw = new Bw()
      block.toBw(bw)
      bw
        .toBuffer()
        .toString('hex')
        .should.equal(blockhex)
    })
  })

  describe('#hash', function () {
    it('should return the correct hash of the genesis block', function () {
      let block = new Block().fromBuffer(genesisbuf)
      let blockhash = Buffer.from(
        Array.apply([], Buffer.from(genesisidhex, 'hex')).reverse()
      )
      block
        .hash()
        .toString('hex')
        .should.equal(blockhash.toString('hex'))
    })
  })

  describe('#asyncHash', function () {
    it('should return the correct hash of the genesis block', async function () {
      let block = new Block().fromBuffer(genesisbuf)
      let hash = await block.asyncHash()
      let genesishashhex = new Br(Buffer.from(genesisidhex, 'hex'))
        .readReverse()
        .toString('hex')
      hash.toString('hex').should.equal(genesishashhex)
    })

    it('should return the correct hash of block containIng the largest tx', async function () {
      let block = new Block().fromHex(largesttxblockvector.blockhex)
      let buf = block.toBuffer()
      block = block.fromBuffer(buf)
      let hash = await block.asyncHash()
      let blockidhex = largesttxblockvector.blockidhex
      let blockhashBuf = new Br(Buffer.from(blockidhex, 'hex')).readReverse()
      let blockhashhex = blockhashBuf.toString('hex')
      hash.toString('hex').should.equal(blockhashhex)
    })
  })

  describe('#id', function () {
    it('should return the correct id of the genesis block', function () {
      let block = new Block().fromBuffer(genesisbuf)
      block
        .id()
        .should.equal(genesisidhex)
    })

    it('should return the correct id of block containing the largest tx', function () {
      let block = new Block().fromHex(largesttxblockvector.blockhex)
      block
        .id()
        .should.equal(largesttxblockvector.blockidhex)
    })
  })

  describe('#asyncId', function () {
    it('should return the correct id of the genesis block', async function () {
      let block = new Block().fromBuffer(genesisbuf)
      let id = await block.asyncId()
      id.should.equal(genesisidhex)
    })

    it('should return the correct id of block containing the largest tx', async function () {
      let block = new Block().fromHex(largesttxblockvector.blockhex)
      let id = await block.asyncId()
      id.should.equal(largesttxblockvector.blockidhex)
    })
  })

  describe('#verifyMerkleRoot', function () {
    it('should verify the merkle root of this known block with one tx (in addition to the coinbase tx)', function () {
      let block = new Block().fromHex(largesttxblockvector.blockhex)
      block.verifyMerkleRoot().should.equal(0)
    })
  })
})
