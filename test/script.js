/* global describe,it */
'use strict'
import { Bn } from '../lib/bn'
import { OpCode } from '../lib/op-code'
import { PrivKey } from '../lib/priv-key'
import { PubKey } from '../lib/pub-key'
import { Script } from '../lib/script'
import should from 'should'

import scriptInvalid from './vectors/bitcoind/script_invalid.json'
import scriptValid from './vectors/bitcoind/script_valid.json'

describe('Script', function () {
  it('should make a new script', function () {
    const script = new Script()
    should.exist(script)
    new Script().toString().should.equal('')
    new Script()
      .writeString('')
      .toString()
      .should.equal('')
  })

  describe('#fromHex', function () {
    it('should parse this hex string containing an OP code', function () {
      const buf = Buffer.alloc(1)
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromHex(buf.toString('hex'))
      script.chunks.length.should.equal(1)
      script.chunks[0].opCodeNum.should.equal(buf[0])
    })
  })

  describe('#fromBuffer', function () {
    it('should parse this buffer containing an OP code', function () {
      const buf = Buffer.alloc(1)
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].opCodeNum.should.equal(buf[0])
    })

    it('should parse this buffer containing another OP code', function () {
      const buf = Buffer.alloc(1)
      buf[0] = new OpCode().fromString('OP_CHECKMULTISIG').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].opCodeNum.should.equal(buf[0])
    })

    it('should parse this buffer containing three bytes of data', function () {
      const buf = Buffer.from([3, 1, 2, 3])
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
    })

    it('should parse this buffer containing OP_PUSHDATA1 and three bytes of data', function () {
      const buf = Buffer.from([0, 0, 1, 2, 3])
      buf[0] = new OpCode().fromString('OP_PUSHDATA1').toNumber()
      buf.writeUInt8(3, 1)
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
    })

    it('should parse this buffer containing OP_PUSHDATA1 and zero bytes of data', function () {
      const buf = Buffer.from([0])
      buf[0] = new OpCode().fromString('OP_PUSHDATA1').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('')
    })

    it('should parse this buffer containing OP_PUSHDATA2 and zero bytes of data', function () {
      const buf = Buffer.from([0])
      buf[0] = new OpCode().fromString('OP_PUSHDATA2').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('')
    })

    it('should parse this buffer containing OP_PUSHDATA2 and three bytes of data', function () {
      const buf = Buffer.from([0, 0, 0, 1, 2, 3])
      buf[0] = new OpCode().fromString('OP_PUSHDATA2').toNumber()
      buf.writeUInt16LE(3, 1)
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
    })

    it('should parse this buffer containing OP_PUSHDATA4 and zero bytes of data', function () {
      const buf = Buffer.from([0, 0])
      buf[0] = new OpCode().fromString('OP_PUSHDATA4').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('')
    })

    it('should parse this buffer containing OP_PUSHDATA4 and three bytes of data', function () {
      const buf = Buffer.from([0, 0, 0, 0, 0, 1, 2, 3])
      buf[0] = new OpCode().fromString('OP_PUSHDATA4').toNumber()
      buf.writeUInt16LE(3, 1)
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
    })

    it('should parse this buffer an OP code, data, and another OP code', function () {
      const buf = Buffer.from([0, 0, 0, 0, 0, 0, 1, 2, 3, 0])
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      buf[1] = new OpCode().fromString('OP_PUSHDATA4').toNumber()
      buf.writeUInt16LE(3, 2)
      buf[buf.length - 1] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(3)
      script.chunks[0].opCodeNum.should.equal(buf[0])
      script.chunks[1].buf.toString('hex').should.equal('010203')
      script.chunks[2].opCodeNum.should.equal(buf[buf.length - 1])
    })
  })

  describe('#toBuffer', function () {
    it('should output this hex string containing an OP code', function () {
      const buf = Buffer.alloc(1)
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromHex(buf.toString('hex'))
      script.chunks.length.should.equal(1)
      script.chunks[0].opCodeNum.should.equal(buf[0])
      script.toHex().should.equal(buf.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should output this buffer containing an OP code', function () {
      const buf = Buffer.alloc(1)
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].opCodeNum.should.equal(buf[0])
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should output this buffer containing another OP code', function () {
      const buf = Buffer.alloc(1)
      buf[0] = new OpCode().fromString('OP_CHECKMULTISIG').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].opCodeNum.should.equal(buf[0])
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should output this buffer containing three bytes of data', function () {
      const buf = Buffer.from([3, 1, 2, 3])
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should output this buffer containing OP_PUSHDATA1 and three bytes of data', function () {
      const buf = Buffer.from([0, 0, 1, 2, 3])
      buf[0] = new OpCode().fromString('OP_PUSHDATA1').toNumber()
      buf.writeUInt8(3, 1)
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should output this buffer containing OP_PUSHDATA2 and three bytes of data', function () {
      const buf = Buffer.from([0, 0, 0, 1, 2, 3])
      buf[0] = new OpCode().fromString('OP_PUSHDATA2').toNumber()
      buf.writeUInt16LE(3, 1)
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should output this buffer containing OP_PUSHDATA4 and three bytes of data', function () {
      const buf = Buffer.from([0, 0, 0, 0, 0, 1, 2, 3])
      buf[0] = new OpCode().fromString('OP_PUSHDATA4').toNumber()
      buf.writeUInt16LE(3, 1)
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(1)
      script.chunks[0].buf.toString('hex').should.equal('010203')
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should output this buffer an OP code, data, and another OP code', function () {
      const buf = Buffer.from([0, 0, 0, 0, 0, 0, 1, 2, 3, 0])
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      buf[1] = new OpCode().fromString('OP_PUSHDATA4').toNumber()
      buf.writeUInt16LE(3, 2)
      buf[buf.length - 1] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(3)
      script.chunks[0].opCodeNum.should.equal(buf[0])
      script.chunks[1].buf.toString('hex').should.equal('010203')
      script.chunks[2].opCodeNum.should.equal(buf[buf.length - 1])
      script
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })
  })

  describe('#fromString', function () {
    it('should parse these known scripts', function () {
      new Script()
        .fromString('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
        .toString()
        .should.equal('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
      new Script()
        .fromString('OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIG')
        .toString()
        .should.equal('OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIG')
      new Script()
        .fromString('OP_SHA256 32 0x8cc17e2a2b10e1da145488458a6edec4a1fdb1921c2d5ccbc96aa0ed31b4d5f8 OP_EQUALVERIFY OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIGVERIFY OP_EQUALVERIFY OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIG')
        .toString()
        .should.equal('OP_SHA256 32 0x8cc17e2a2b10e1da145488458a6edec4a1fdb1921c2d5ccbc96aa0ed31b4d5f8 OP_EQUALVERIFY OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIGVERIFY OP_EQUALVERIFY OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIG')
      new Script()
        .fromString('OP_0 OP_PUSHDATA2 3 0x010203 OP_0')
        .toString()
        .should.equal('OP_0 OP_PUSHDATA2 3 0x010203 OP_0')
      new Script()
        .fromString('OP_0 OP_PUSHDATA1 3 0x010203 OP_0')
        .toString()
        .should.equal('OP_0 OP_PUSHDATA1 3 0x010203 OP_0')
      new Script()
        .fromString('OP_0 3 0x010203 OP_0')
        .toString()
        .should.equal('OP_0 3 0x010203 OP_0')
      new Script()
        .fromString('')
        .toString()
        .should.equal('')
      new Script()
        .fromString()
        .toString()
        .should.equal('')
    })
  })

  describe('#toString', function () {
    it('should output this buffer an OP code, data, and another OP code', function () {
      const buf = Buffer.from([0, 0, 0, 0, 0, 0, 1, 2, 3, 0])
      buf[0] = new OpCode().fromString('OP_0').toNumber()
      buf[1] = new OpCode().fromString('OP_PUSHDATA4').toNumber()
      buf.writeUInt16LE(3, 2)
      buf[buf.length - 1] = new OpCode().fromString('OP_0').toNumber()
      const script = new Script().fromBuffer(buf)
      script.chunks.length.should.equal(3)
      script.chunks[0].opCodeNum.should.equal(buf[0])
      script.chunks[1].buf.toString('hex').should.equal('010203')
      script.chunks[2].opCodeNum.should.equal(buf[buf.length - 1])
      script
        .toString()
        .toString('hex')
        .should.equal('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
    })
  })

  describe('#fromBitcoindString', function () {
    it('should convert from this known string', function () {
      new Script()
        .fromBitcoindString('DEPTH 0 EQUAL')
        .toBitcoindString()
        .should.equal('DEPTH 0 EQUAL')
      new Script()
        .fromBitcoindString(
          "'Azzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' EQUAL"
        )
        .toBitcoindString()
        .should.equal(
          '0x4b417a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a EQUAL'
        )

      const str =
        '0x4c47304402203acf75dd59bbef171aeeedae4f1020b824195820db82575c2b323b8899f95de9022067df297d3a5fad049ba0bb81255d0e495643cbcf9abae9e396988618bc0c6dfe01 0x47304402205f8b859230c1cab7d4e8de38ff244d2ebe046b64e8d3f4219b01e483c203490a022071bdc488e31b557f7d9e5c8a8bec90dc92289ca70fa317685f4f140e38b30c4601'
      new Script()
        .fromBitcoindString(str)
        .toBitcoindString()
        .should.equal(str)
    })

    it('should convert to this known string', function () {
      new Script()
        .fromBitcoindString('DEPTH 0 EQUAL')
        .toBitcoindString()
        .should.equal('DEPTH 0 EQUAL')
    })
  })

  describe('@fromBitcoindString', function () {
    it('should convert from this known string', function () {
      Script.fromBitcoindString('DEPTH 0 EQUAL')
        .toBitcoindString()
        .should.equal('DEPTH 0 EQUAL')
      Script.fromBitcoindString(
        "'Azzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' EQUAL"
      )
        .toBitcoindString()
        .should.equal(
          '0x4b417a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a EQUAL'
        )

      const str =
        '0x4c47304402203acf75dd59bbef171aeeedae4f1020b824195820db82575c2b323b8899f95de9022067df297d3a5fad049ba0bb81255d0e495643cbcf9abae9e396988618bc0c6dfe01 0x47304402205f8b859230c1cab7d4e8de38ff244d2ebe046b64e8d3f4219b01e483c203490a022071bdc488e31b557f7d9e5c8a8bec90dc92289ca70fa317685f4f140e38b30c4601'
      Script.fromBitcoindString(str)
        .toBitcoindString()
        .should.equal(str)
    })

    it('should convert to this known string', function () {
      Script.fromBitcoindString('DEPTH 0 EQUAL')
        .toBitcoindString()
        .should.equal('DEPTH 0 EQUAL')
    })

    it('should convert to this known string', function () {
      Script.fromAsmString('OP_DUP OP_HASH160 6fa5502ea094d59576898b490d866b32a61b89f6 OP_EQUALVERIFY OP_CHECKSIG')
        .toAsmString()
        .should.equal('OP_DUP OP_HASH160 6fa5502ea094d59576898b490d866b32a61b89f6 OP_EQUALVERIFY OP_CHECKSIG')
    })
  })

  describe('@fromAsmString', function () {
    it('should parse this known script in ASM', function () {
      var asm = 'OP_DUP OP_HASH160 f4c03610e60ad15100929cc23da2f3a799af1725 OP_EQUALVERIFY OP_CHECKSIG'
      var script = Script.fromAsmString(asm)
      script.chunks[0].opCodeNum.should.equal(OpCode.OP_DUP)
      script.chunks[1].opCodeNum.should.equal(OpCode.OP_HASH160)
      script.chunks[2].opCodeNum.should.equal(20)
      script.chunks[2].buf.toString('hex').should.equal('f4c03610e60ad15100929cc23da2f3a799af1725')
      script.chunks[3].opCodeNum.should.equal(OpCode.OP_EQUALVERIFY)
      script.chunks[4].opCodeNum.should.equal(OpCode.OP_CHECKSIG)
    })

    it('should parse this known problematic script in ASM', function () {
      var asm = 'OP_RETURN 026d02 0568656c6c6f'
      var script = Script.fromAsmString(asm)
      script.toAsmString().should.equal(asm)
    })

    it('should know this is invalid hex', function () {
      var asm = 'OP_RETURN 026d02 0568656c6c6fzz'
      let errors = 0
      try {
        errors++
        var script = Script.fromAsmString(asm)
        script.toAsmString().should.equal(asm)
      } catch (err) {
        err.message.should.equal('invalid hex string in script')
      }
      errors.should.equal(1)
    })

    it('should parse this long PUSHDATA1 script in ASM', function () {
      var buf = Buffer.alloc(220, 0)
      var asm = 'OP_RETURN ' + buf.toString('hex')
      var script = Script.fromAsmString(asm)
      script.chunks[1].opCodeNum.should.equal(OpCode.OP_PUSHDATA1)
      script.toAsmString().should.equal(asm)
    })

    it('should parse this long PUSHDATA2 script in ASM', function () {
      var buf = Buffer.alloc(1024, 0)
      var asm = 'OP_RETURN ' + buf.toString('hex')
      var script = Script.fromAsmString(asm)
      script.chunks[1].opCodeNum.should.equal(OpCode.OP_PUSHDATA2)
      script.toAsmString().should.equal(asm)
    })

    it('should parse this long PUSHDATA4 script in ASM', function () {
      var buf = Buffer.alloc(Math.pow(2, 17), 0)
      var asm = 'OP_RETURN ' + buf.toString('hex')
      var script = Script.fromAsmString(asm)
      script.chunks[1].opCodeNum.should.equal(OpCode.OP_PUSHDATA4)
      script.toAsmString().should.equal(asm)
    })

    it('should return this script correctly', function () {
      var asm1 = 'OP_FALSE'
      var asm2 = 'OP_0'
      var asm3 = '0'
      Script.fromAsmString(asm1).toAsmString().should.equal(asm3)
      Script.fromAsmString(asm2).toAsmString().should.equal(asm3)
      Script.fromAsmString(asm3).toAsmString().should.equal(asm3)
    })

    it('should return this script correctly', function () {
      var asm1 = 'OP_1NEGATE'
      var asm2 = '-1'
      Script.fromAsmString(asm1).toAsmString().should.equal(asm2)
      Script.fromAsmString(asm2).toAsmString().should.equal(asm2)
    })
  })

  describe('#fromJSON', function () {
    it('should parse this known script', function () {
      new Script()
        .fromJSON('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
        .toString()
        .should.equal('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
    })
  })

  describe('#toJSON', function () {
    it('should output this known script', function () {
      new Script()
        .fromString('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
        .toJSON()
        .should.equal('OP_0 OP_PUSHDATA4 3 0x010203 OP_0')
    })
  })

  describe('@fromOpReturnData', function () {
    it('should create valid op return output', function () {
      const script = Script.fromOpReturnData(Buffer.from('yours bitcoin'))
      script.isOpReturn().should.equal(true)
    })
  })

  describe('@fromSafeData', function () {
    it('should create valid op return output', function () {
      const script = Script.fromSafeData(Buffer.from('yours bitcoin'))
      script.isSafeDataOut().should.equal(true)
    })

    it('should create valid op return output', function () {
      Script.fromSafeDataArray([Buffer.from('ff', 'hex'), Buffer.from('aa', 'hex')]).toAsmString().should.equal('0 OP_RETURN ff aa')
      Script.fromSafeDataArray([Buffer.from('ff', 'hex'), Buffer.from('aa', 'hex')]).toString().should.equal('OP_0 OP_RETURN 1 0xff 1 0xaa')
    })
  })

  describe('@fromSafeDataArray', function () {
    it('should create valid op return output', function () {
      const script = Script.fromSafeDataArray([Buffer.from('yours bitcoin'), Buffer.from('bsv')])
      script.isSafeDataOut().should.equal(true)
    })
  })

  describe('#getData', function () {
    it('should create valid op return output', function () {
      const script = Script.fromSafeDataArray([Buffer.from('yours bitcoin'), Buffer.from('bsv')])
      script.isSafeDataOut().should.equal(true)
      const bufs = script.getData()
      bufs[0].toString().should.equal('yours bitcoin')
      bufs[1].toString().should.equal('bsv')
    })
  })

  describe('#fromPubKeyHash', function () {
    it('should create pubKeyHash output script', function () {
      const hashBuf = Buffer.alloc(20)
      hashBuf.fill(0)
      new Script()
        .fromPubKeyHash(hashBuf)
        .toString()
        .should.equal(
          'OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG'
        )
    })
  })

  describe('@fromPubKeyHash', function () {
    it('should create pubKeyHash output script', function () {
      const hashBuf = Buffer.alloc(20)
      hashBuf.fill(0)
      Script.fromPubKeyHash(hashBuf)
        .toString()
        .should.equal(
          'OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG'
        )
    })
  })

  describe('@sortPubKeys', function () {
    it('should sort these pubKeys in a known order', function () {
      const testPubKeysHex = [
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0',
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758',
        '0266dd7664e65958f3cc67bf92ad6243bc495df5ab56691719263977104b635bea',
        '02ee91377073b04d1d9d19597b81a7be3db6554bd7d16151cb5599a6107a589e70',
        '02c8f63ad4822ef360b5c300f08488fa0fa24af2b2bebb6d6b602ca938ee5af793'
      ]
      const pubKeys = testPubKeysHex.map(hex => new PubKey().fromHex(hex))
      const pubKeysSorted = Script.sortPubKeys(pubKeys)
      pubKeysSorted[0].toString('hex').should.equal(testPubKeysHex[2])
      pubKeysSorted[1].toString('hex').should.equal(testPubKeysHex[1])
      pubKeysSorted[2].toString('hex').should.equal(testPubKeysHex[0])
      pubKeysSorted[3].toString('hex').should.equal(testPubKeysHex[4])
      pubKeysSorted[4].toString('hex').should.equal(testPubKeysHex[3])
    })
  })

  describe('#fromPubKeys', function () {
    it('should generate this known script from a list of public keys', function () {
      const privKey = new PrivKey().fromBn(new Bn(5))
      const pubKey = new PubKey().fromPrivKey(privKey)
      const script = new Script().fromPubKeys(2, [pubKey, pubKey, pubKey])
      script
        .toString()
        .should.equal(
          'OP_2 33 0x022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4 33 0x022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4 33 0x022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4 OP_3 OP_CHECKMULTISIG'
        )
    })

    it('should generate this known script from a list of public keys, sorted', function () {
      const pubKey1 = new PubKey().fromHex(
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0'
      )
      const pubKey2 = new PubKey().fromHex(
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758'
      )
      const script = new Script().fromPubKeys(2, [pubKey1, pubKey2])
      script
        .toString()
        .should.equal(
          'OP_2 33 0x02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758 33 0x02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0 OP_2 OP_CHECKMULTISIG'
        )
    })

    it('should generate this known script from a list of public keys, sorted explicitly', function () {
      const pubKey1 = new PubKey().fromHex(
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0'
      )
      const pubKey2 = new PubKey().fromHex(
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758'
      )
      const script = new Script().fromPubKeys(2, [pubKey1, pubKey2], true)
      script
        .toString()
        .should.equal(
          'OP_2 33 0x02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758 33 0x02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0 OP_2 OP_CHECKMULTISIG'
        )
    })

    it('should generate this known script from a list of public keys, unsorted', function () {
      const pubKey1 = new PubKey().fromHex(
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0'
      )
      const pubKey2 = new PubKey().fromHex(
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758'
      )
      const script = new Script().fromPubKeys(2, [pubKey1, pubKey2], false)
      script
        .toString()
        .should.equal(
          'OP_2 33 0x02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0 33 0x02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758 OP_2 OP_CHECKMULTISIG'
        )
    })
  })

  describe('@fromPubKeys', function () {
    it('should generate this known script from a list of public keys', function () {
      const privKey = PrivKey.fromBn(new Bn(5))
      const pubKey = PubKey.fromPrivKey(privKey)
      const script = Script.fromPubKeys(2, [pubKey, pubKey, pubKey])
      script
        .toString()
        .should.equal(
          'OP_2 33 0x022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4 33 0x022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4 33 0x022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4 OP_3 OP_CHECKMULTISIG'
        )
    })

    it('should generate this known script from a list of public keys, sorted', function () {
      const pubKey1 = PubKey.fromHex(
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0'
      )
      const pubKey2 = PubKey.fromHex(
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758'
      )
      const script = Script.fromPubKeys(2, [pubKey1, pubKey2])
      script
        .toString()
        .should.equal(
          'OP_2 33 0x02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758 33 0x02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0 OP_2 OP_CHECKMULTISIG'
        )
    })

    it('should generate this known script from a list of public keys, sorted explicitly', function () {
      const pubKey1 = PubKey.fromHex(
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0'
      )
      const pubKey2 = PubKey.fromHex(
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758'
      )
      const script = Script.fromPubKeys(2, [pubKey1, pubKey2], true)
      script
        .toString()
        .should.equal(
          'OP_2 33 0x02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758 33 0x02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0 OP_2 OP_CHECKMULTISIG'
        )
    })

    it('should generate this known script from a list of public keys, unsorted', function () {
      const pubKey1 = PubKey.fromHex(
        '02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0'
      )
      const pubKey2 = PubKey.fromHex(
        '02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758'
      )
      const script = Script.fromPubKeys(2, [pubKey1, pubKey2], false)
      script
        .toString()
        .should.equal(
          'OP_2 33 0x02c525d65d18be8fb36ab50a21bee02ac9fdc2c176fa18791ac664ea4b95572ae0 33 0x02b937d54b550a3afdc2819772822d25869495f9e588b56a0205617d80514f0758 OP_2 OP_CHECKMULTISIG'
        )
    })
  })

  describe('#removeCodeseparators', function () {
    it('should remove any OP_CODESEPARATORs', function () {
      new Script()
        .writeString('OP_CODESEPARATOR OP_0 OP_CODESEPARATOR')
        .removeCodeseparators()
        .toString()
        .should.equal('OP_0')
    })
  })

  describe('#isPushOnly', function () {
    it("should know these scripts are or aren't push only", function () {
      new Script()
        .writeString('OP_0')
        .isPushOnly()
        .should.equal(true)
      new Script()
        .writeString('OP_0 OP_RETURN')
        .isPushOnly()
        .should.equal(false)
      new Script()
        .writeString('OP_PUSHDATA1 5 0x1010101010')
        .isPushOnly()
        .should.equal(true)

      // like bitcoind, we regard OP_RESERVED as being "push only"
      new Script()
        .writeString('OP_RESERVED')
        .isPushOnly()
        .should.equal(true)
    })
  })

  describe('#isOpReturn', function () {
    it('should know this is a (blank) OP_RETURN script', function () {
      new Script()
        .writeString('OP_RETURN')
        .isOpReturn()
        .should.equal(true)
    })

    it('should know this is an OP_RETURN script', function () {
      const buf = Buffer.alloc(40)
      buf.fill(0)
      new Script()
        .writeString('OP_RETURN 40 0x' + buf.toString('hex'))
        .isOpReturn()
        .should.equal(true)
    })

    it('should know this is not an OP_RETURN script', function () {
      const buf = Buffer.alloc(40)
      buf.fill(0)
      new Script()
        .writeString('OP_CHECKMULTISIG 40 0x' + buf.toString('hex'))
        .isOpReturn()
        .should.equal(false)
    })
  })

  describe('#isPubKeyHashIn', function () {
    it('should classify this known pubKeyHashin', function () {
      new Script()
        .writeString(
          '73 0x3046022100bb3c194a30e460d81d34be0a230179c043a656f67e3c5c8bf47eceae7c4042ee0221008bf54ca11b2985285be0fd7a212873d243e6e73f5fad57e8eb14c4f39728b8c601 65 0x04e365859b3c78a8b7c202412b949ebca58e147dba297be29eee53cd3e1d300a6419bc780cc9aec0dc94ed194e91c8f6433f1b781ee00eac0ead2aae1e8e0712c6'
        )
        .isPubKeyHashIn()
        .should.equal(true)
    })

    it('should classify this known non-pubKeyHashin', function () {
      new Script()
        .writeString(
          '73 0x3046022100bb3c194a30e460d81d34be0a230179c043a656f67e3c5c8bf47eceae7c4042ee0221008bf54ca11b2985285be0fd7a212873d243e6e73f5fad57e8eb14c4f39728b8c601 65 0x04e365859b3c78a8b7c202412b949ebca58e147dba297be29eee53cd3e1d300a6419bc780cc9aec0dc94ed194e91c8f6433f1b781ee00eac0ead2aae1e8e0712c6 OP_CHECKSIG'
        )
        .isPubKeyHashIn()
        .should.equal(false)
    })
  })

  describe('#isPubKeyHashOut', function () {
    it('should classify this known pubKeyHashout as pubKeyHashout', function () {
      new Script()
        .writeString(
          'OP_DUP OP_HASH160 20 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG'
        )
        .isPubKeyHashOut()
        .should.equal(true)
    })

    it('should classify this known non-pubKeyHashout as not pubKeyHashout', function () {
      new Script()
        .writeString(
          'OP_DUP OP_HASH160 20 0000000000000000000000000000000000000000'
        )
        .isPubKeyHashOut()
        .should.equal(false)
    })
  })

  describe('#isScriptHashIn', function () {
    it('should classify this known scriptHashin', function () {
      new Script()
        .writeString('20 0000000000000000000000000000000000000000')
        .isScriptHashIn()
        .should.equal(true)
    })

    it('should classify this known non-scriptHashin', function () {
      new Script()
        .writeString('20 0000000000000000000000000000000000000000 OP_CHECKSIG')
        .isScriptHashIn()
        .should.equal(false)
    })
  })

  describe('#isScriptHashOut', function () {
    it('should classify this known pubKeyHashout as pubKeyHashout', function () {
      new Script()
        .writeString(
          'OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUAL'
        )
        .isScriptHashOut()
        .should.equal(true)
    })

    it('should classify these known non-pubKeyHashout as not pubKeyHashout', function () {
      new Script()
        .writeString(
          'OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUAL OP_EQUAL'
        )
        .isScriptHashOut()
        .should.equal(false)
      new Script()
        .writeString(
          'OP_HASH160 21 0x000000000000000000000000000000000000000000 OP_EQUAL'
        )
        .isScriptHashOut()
        .should.equal(false)
    })
  })

  describe('#isMultiSigIn', function () {
    it('should know this is a valid multisig input', function () {
      new Script()
        .writeString(
          'OP_0 71 0x3044022053cacd1a0720e3497b3e78dedfc3ac144b3ff8fb0e231a4121bf4c18a05e606702205d4c69f2611cbca41c8a392b4c274cb07477bae78efef45c65517e4fdea5c0d801 71 0x3044022017dda0d737a9a65b262a1a8da97e73c23550351d6337ca13a8a1dbdbeae2775d02202fe4c031050d9d4ee0a2b1d5302869e1432577129f842c952462fca92a7b012901'
        )
        .isMultiSigIn()
        .should.equal(true)
    })

    it('should know this is not a valid multisig input', function () {
      new Script()
        .writeString(
          'OP_1 71 0x3044022053cacd1a0720e3497b3e78dedfc3ac144b3ff8fb0e231a4121bf4c18a05e606702205d4c69f2611cbca41c8a392b4c274cb07477bae78efef45c65517e4fdea5c0d801 71 0x3044022017dda0d737a9a65b262a1a8da97e73c23550351d6337ca13a8a1dbdbeae2775d02202fe4c031050d9d4ee0a2b1d5302869e1432577129f842c952462fca92a7b012901'
        )
        .isMultiSigIn()
        .should.equal(false)
    })

    it('should know this is not a valid multisig input', function () {
      new Script()
        .writeString('OP_0')
        .isMultiSigIn()
        .should.equal(false)
    })
  })

  describe('#isMultiSigOut', function () {
    it('should know this is a valid multisig output', function () {
      new Script()
        .writeString(
          'OP_1 33 0x029cf97e1052008852da9d107411b2d47aad387612558fa864b723c484f8931176 33 0x02f23ab919b3a4795c75552b3985982f54c4164a26948b9fe87625705f694e7aa9 OP_2 OP_CHECKMULTISIG'
        )
        .isMultiSigOut()
        .should.equal(true)
    })

    it('should know this is a valid multisig output', function () {
      new Script()
        .writeString(
          'OP_2 33 0x029cf97e1052008852da9d107411b2d47aad387612558fa864b723c484f8931176 33 0x02f23ab919b3a4795c75552b3985982f54c4164a26948b9fe87625705f694e7aa9 OP_2 OP_CHECKMULTISIG'
        )
        .isMultiSigOut()
        .should.equal(true)
    })

    it('should know this is not a valid multisig output', function () {
      new Script()
        .writeString(
          'OP_2 33 0x029cf97e1052008852da9d107411b2d47aad387612558fa864b723c484f8931176 33 0x02f23ab919b3a4795c75552b3985982f54c4164a26948b9fe87625705f694e7aa9 OP_1 OP_CHECKMULTISIG'
        )
        .isMultiSigOut()
        .should.equal(false)
    })

    it('should know this is not a valid multisig output', function () {
      new Script()
        .writeString(
          'OP_2 33 0x029cf97e1052008852da9d107411b2d47aad387612558fa864b723c484f8931176 33 0x02f23ab919b3a4795c75552b3985982f54c4164a26948b9fe87625705f694e7aa9 OP_2 OP_RETURN'
        )
        .isMultiSigOut()
        .should.equal(false)
    })

    it('should know this is not a valid multisig output', function () {
      new Script()
        .writeString(
          'OP_2 33 0x029cf97e1052008852da9d107411b2d47aad387612558fa864b723c484f8931176 32 0xf23ab919b3a4795c75552b3985982f54c4164a26948b9fe87625705f694e7aa9 OP_2 OP_CHECKMULTISIG'
        )
        .isMultiSigOut()
        .should.equal(false)
    })
  })

  describe('#findAndDelete', function () {
    it('should find and deconste this buffer', function () {
      new Script()
        .writeString('OP_RETURN 2 0xf0f0')
        .findAndDelete(new Script().writeString('2 0xf0f0'))
        .toString()
        .should.equal('OP_RETURN')
    })
  })

  describe('#writeScript', function () {
    it('should write these scripts', function () {
      const script1 = new Script().fromString('OP_CHECKMULTISIG')
      const script2 = new Script().fromString('OP_CHECKMULTISIG')
      const script = script1.writeScript(script2)
      script.toString().should.equal('OP_CHECKMULTISIG OP_CHECKMULTISIG')
    })
  })

  describe('@writeScript', function () {
    it('should write these scripts', function () {
      const script1 = Script.fromString('OP_CHECKMULTISIG')
      const script2 = Script.fromString('OP_CHECKMULTISIG')
      const script = script1.writeScript(script2)
      script.toString().should.equal('OP_CHECKMULTISIG OP_CHECKMULTISIG')
    })
  })

  describe('#writeOpCode', function () {
    it('should write this op', function () {
      new Script()
        .writeOpCode(OpCode.OP_CHECKMULTISIG)
        .toString()
        .should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('@writeOpCode', function () {
    it('should write this op', function () {
      Script.writeOpCode(OpCode.OP_CHECKMULTISIG)
        .toString()
        .should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#setChunkOpCode', function () {
    it('should set this op', function () {
      const script = new Script().writeOpCode(OpCode.OP_CHECKMULTISIG)
      script.setChunkOpCode(0, OpCode.OP_CHECKSEQUENCEVERIFY)
      script.chunks[0].opCodeNum.should.equal(OpCode.OP_CHECKSEQUENCEVERIFY)
    })
  })

  describe('#writeBn', function () {
    it('should write these numbers', function () {
      new Script()
        .writeBn(new Bn(0))
        .toBuffer()
        .toString('hex')
        .should.equal('00')
      new Script()
        .writeBn(new Bn(1))
        .toBuffer()
        .toString('hex')
        .should.equal('51')
      new Script()
        .writeBn(new Bn(16))
        .toBuffer()
        .toString('hex')
        .should.equal('60')
      new Script()
        .writeBn(new Bn(-1))
        .toBuffer()
        .toString('hex')
        .should.equal('4f')
      new Script()
        .writeBn(new Bn(-2))
        .toBuffer()
        .toString('hex')
        .should.equal('0182')
    })
  })

  describe('@writeBn', function () {
    it('should write these numbers', function () {
      Script.writeBn(new Bn(0))
        .toBuffer()
        .toString('hex')
        .should.equal('00')
      Script.writeBn(new Bn(1))
        .toBuffer()
        .toString('hex')
        .should.equal('51')
      Script.writeBn(new Bn(16))
        .toBuffer()
        .toString('hex')
        .should.equal('60')
      Script.writeBn(new Bn(-1))
        .toBuffer()
        .toString('hex')
        .should.equal('4f')
      Script.writeBn(new Bn(-2))
        .toBuffer()
        .toString('hex')
        .should.equal('0182')
    })
  })

  describe('#writeNumber', function () {
    it('should write these numbers', function () {
      new Script()
        .writeNumber(0)
        .toBuffer()
        .toString('hex')
        .should.equal('00')
      new Script()
        .writeNumber(1)
        .toBuffer()
        .toString('hex')
        .should.equal('51')
      new Script()
        .writeNumber(16)
        .toBuffer()
        .toString('hex')
        .should.equal('60')
      new Script()
        .writeNumber(-1)
        .toBuffer()
        .toString('hex')
        .should.equal('4f')
      new Script()
        .writeNumber(-2)
        .toBuffer()
        .toString('hex')
        .should.equal('0182')
    })
  })

  describe('@writeNumber', function () {
    it('should write these numbers', function () {
      Script.writeNumber(0)
        .toBuffer()
        .toString('hex')
        .should.equal('00')
      Script.writeNumber(1)
        .toBuffer()
        .toString('hex')
        .should.equal('51')
      Script.writeNumber(16)
        .toBuffer()
        .toString('hex')
        .should.equal('60')
      Script.writeNumber(-1)
        .toBuffer()
        .toString('hex')
        .should.equal('4f')
      Script.writeNumber(-2)
        .toBuffer()
        .toString('hex')
        .should.equal('0182')
    })
  })

  describe('#setChunkBn', function () {
    it('should set this bn', function () {
      const script = new Script().writeOpCode(OpCode.OP_CHECKMULTISIG)
      script.setChunkBn(0, new Bn(5000000000000000))
      script.chunks[0].buf
        .toString('hex')
        .should.equal(
          new Bn(5000000000000000)
            .toBuffer({ endian: 'little' })
            .toString('hex')
        )
    })
  })

  describe('#writeBuffer', function () {
    it('should write these push data', function () {
      let buf = Buffer.alloc(1)
      buf.fill(0)
      new Script()
        .writeBuffer(buf)
        .toString()
        .should.equal('1 0x00')
      buf = Buffer.alloc(255)
      buf.fill(0)
      new Script()
        .writeBuffer(buf)
        .toString()
        .should.equal('OP_PUSHDATA1 255 0x' + buf.toString('hex'))
      buf = Buffer.alloc(256)
      buf.fill(0)
      new Script()
        .writeBuffer(buf)
        .toString()
        .should.equal('OP_PUSHDATA2 256 0x' + buf.toString('hex'))
      buf = Buffer.alloc(Math.pow(2, 16))
      buf.fill(0)
      new Script()
        .writeBuffer(buf)
        .toString()
        .should.equal(
          'OP_PUSHDATA4 ' + Math.pow(2, 16) + ' 0x' + buf.toString('hex')
        )
    })
  })

  describe('@writeBuffer', function () {
    it('should write these push data', function () {
      let buf = Buffer.alloc(1)
      buf.fill(0)
      Script.writeBuffer(buf)
        .toString()
        .should.equal('1 0x00')
      buf = Buffer.alloc(255)
      buf.fill(0)
      Script.writeBuffer(buf)
        .toString()
        .should.equal('OP_PUSHDATA1 255 0x' + buf.toString('hex'))
      buf = Buffer.alloc(256)
      buf.fill(0)
      Script.writeBuffer(buf)
        .toString()
        .should.equal('OP_PUSHDATA2 256 0x' + buf.toString('hex'))
      buf = Buffer.alloc(Math.pow(2, 16))
      buf.fill(0)
      Script.writeBuffer(buf)
        .toString()
        .should.equal(
          'OP_PUSHDATA4 ' + Math.pow(2, 16) + ' 0x' + buf.toString('hex')
        )
    })
  })

  describe('#setChunkBuffer', function () {
    it('should set this buffer', function () {
      const script = new Script().writeOpCode(OpCode.OP_CHECKMULTISIG)
      const buf = new Bn(5000000000000000).toBuffer()
      script.setChunkBuffer(0, buf)
      script.chunks[0].buf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('#writeString', function () {
    it('should write both pushdata and non-pushdata chunks', function () {
      new Script()
        .writeString('OP_CHECKMULTISIG')
        .toString()
        .should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('@writeString', function () {
    it('should write both pushdata and non-pushdata chunks', function () {
      Script.writeString('OP_CHECKMULTISIG')
        .toString()
        .should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#checkMinimalPush', function () {
    it('should check these minimal pushes', function () {
      let buf
      new Script()
        .writeBn(new Bn(1))
        .checkMinimalPush(0)
        .should.equal(true)
      new Script()
        .writeBn(new Bn(0))
        .checkMinimalPush(0)
        .should.equal(true)
      new Script()
        .writeBn(new Bn(-1))
        .checkMinimalPush(0)
        .should.equal(true)
      new Script()
        .writeBuffer(Buffer.from([0]))
        .checkMinimalPush(0)
        .should.equal(true)

      buf = Buffer.alloc(75)
      buf.fill(1)
      new Script()
        .writeBuffer(buf)
        .checkMinimalPush(0)
        .should.equal(true)

      buf = Buffer.alloc(76)
      buf.fill(1)
      new Script()
        .writeBuffer(buf)
        .checkMinimalPush(0)
        .should.equal(true)

      buf = Buffer.alloc(256)
      buf.fill(1)
      new Script()
        .writeBuffer(buf)
        .checkMinimalPush(0)
        .should.equal(true)
    })
  })

  describe('#isOpReturn', () => {
    it('returns true if the script its only an OP_RETURN opcode', () => {
      const script = new Script().writeOpCode(OpCode.OP_RETURN)
      should(script.isOpReturn()).be.true()
    })

    it('returns false if the script starts with an opcode that is not OP_RETURN', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_ADD)
      should(script.isOpReturn()).be.false()
    })

    it('returns false if the script starts with a push data', () => {
      const script = new Script()
        .writeBuffer(Buffer.from("I'm a buffer"))
      should(script.isOpReturn()).be.false()
    })

    it('returns false if the script starts with "OP_FALSE OP_RETURN"', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_RETURN)
      should(script.isOpReturn()).be.false()
    })

    it('returns false if the script starts OP_RETURN and is followed by an OP_FALSE', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_RETURN)
        .writeOpCode(OpCode.OP_FALSE)
      should(script.isOpReturn()).be.false()
    })

    it('returns false if the script starts OP_RETURN and is followed by data and then OP_FALSE', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_RETURN)
        .writeBuffer(Buffer.from("I'm a buffer"))
        .writeOpCode(OpCode.OP_FALSE)
      should(script.isOpReturn()).be.false()
    })

    it('returns false for the asm script "OP_RETURN 0"', () => {
      const script = Script.fromAsmString('OP_RETURN 0')
      should(script.isOpReturn()).be.false()
    })

    it('throws for empty script', () => {
      const script = new Script()
      should(() => script.isOpReturn()).throw()
    })

    it('returns false for only push data script', () => {
      const script = new Script().writeBuffer(Buffer.from("I'm a lonely buffer"))
      should(script.isOpReturn()).be.false()
    })
  })

  describe('#isNonSpendable', () => {
    it('returns false when OP_TRUE only', () => {
      const script = new Script().writeOpCode(OpCode.OP_TRUE)
      should(script.isNonSpendable()).be.false()
    })

    it('returns true when "OP_FALSE OP_RETURN"', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_RETURN)
      should(script.isNonSpendable()).be.true()
    })

    it('returns false when starts with OP_FALSE but is followed by opcode that is not OP_RETURN', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_ADD)
      should(script.isNonSpendable()).be.false()
    })

    it('returns false when is only OP_FALSE', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
      should(script.isNonSpendable()).be.false()
    })

    it('returns true when is OP_FALSE OP_RETURN and then data', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_RETURN)
        .writeBuffer(Buffer.from('some'))
        .writeBuffer(Buffer.from('data'))

      should(script.isNonSpendable()).be.true()
    })

    it('returns true when is OP_FALSE OP_RETURN and then data plus opcodes', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_RETURN)
        .writeBuffer(Buffer.from('some'))
        .writeBuffer(Buffer.from('data'))
        .writeOpCode(OpCode.OP_ADD)
        .writeBuffer(Buffer.from('more data'))

      should(script.isNonSpendable()).be.true()
    })

    it('returns true when is OP_FALSE OP_RETURN and then opcodes', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_RETURN)
        .writeOpCode(OpCode.OP_ADD)
        .writeOpCode(OpCode.OP_MUL)

      should(script.isNonSpendable()).be.true()
    })

    it('returns true when is OP_FALSE OP_RETURN and then OP_FALSE', () => {
      const script = new Script()
        .writeOpCode(OpCode.OP_FALSE)
        .writeOpCode(OpCode.OP_RETURN)
        .writeOpCode(OpCode.OP_FALSE)

      should(script.isNonSpendable()).be.true()
    })

    it('returns true when for asm script "OP_FALSE OP_RETURN 0"', () => {
      const script = new Script().fromAsmString('OP_FALSE OP_RETURN 0')

      should(script.isNonSpendable()).be.true()
    })
  })

  describe('vectors', function () {
    scriptValid.forEach(function (a, i) {
      if (a.length === 1) {
        return
      }
      it('should not fail when reading scriptValid vector ' + i, function () {
        ;(function () {
          new Script().fromBitcoindString(a[0]).toString()
          new Script().fromBitcoindString(a[0]).toBitcoindString()
        }.should.not.throw())
        ;(function () {
          new Script().fromBitcoindString(a[1]).toString()
          new Script().fromBitcoindString(a[1]).toBitcoindString()
        }.should.not.throw())

        // should be able to return the same output over and over
        let str = new Script().fromBitcoindString(a[0]).toBitcoindString()
        new Script()
          .fromBitcoindString(str)
          .toBitcoindString()
          .should.equal(str)
        str = new Script().fromBitcoindString(a[1]).toBitcoindString()
        new Script()
          .fromBitcoindString(str)
          .toBitcoindString()
          .should.equal(str)
      })
    })

    scriptInvalid.forEach(function (a, i) {
      if (a.length === 1) {
        return
      }
      it('should not fail when reading scriptInvalid vector ' + i, function () {
        ;(function () {
          new Script().fromBitcoindString(a[0]).toString()
          new Script().fromBitcoindString(a[0]).toBitcoindString()
        }.should.not.throw())
        ;(function () {
          new Script().fromBitcoindString(a[1]).toString()
          new Script().fromBitcoindString(a[1]).toBitcoindString()
        }.should.not.throw())

        // should be able to return the same output over and over
        let str = new Script().fromBitcoindString(a[0]).toBitcoindString()
        new Script()
          .fromBitcoindString(str)
          .toBitcoindString()
          .should.equal(str)
        str = new Script().fromBitcoindString(a[1]).toBitcoindString()
        new Script()
          .fromBitcoindString(str)
          .toBitcoindString()
          .should.equal(str)
      })
    })
  })
})
