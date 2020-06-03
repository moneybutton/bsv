/* global describe,it */
'use strict'
import should from 'should'
import assert from 'assert'
import { Bn } from '../lib/bn'

describe('Bn', function () {
  it('should create a bn', function () {
    let bn = new Bn(50)
    should.exist(bn)
    bn.toString().should.equal('50')
    bn = new Bn(50)
    bn.toString().should.equal('50')
    ;(bn instanceof Bn).should.equal(true)
    bn = new Bn('ff00', 16)
    bn.toString(16).should.equal('ff00')
    bn = new Bn('ff00', 16)
    bn.toString(16).should.equal('ff00')
  })

  it('should parse this number', function () {
    const bn = new Bn(999970000)
    bn.toString().should.equal('999970000')
  })

  it('should parse numbers below and at bn.js internal word size', function () {
    let bn = new Bn(Math.pow(2, 26) - 1)
    bn.toString().should.equal((Math.pow(2, 26) - 1).toString())
    bn = new Bn(Math.pow(2, 26))
    bn.toString().should.equal(Math.pow(2, 26).toString())
  })

  it('should correctly square the number related to a bug in bn.js', function () {
    /**
     * These test vectors are related to this bn.js commit:
     * https://github.com/indutny/bn.js/commit/3557d780b07ed0ed301e128f326f83c2226fb679
     *
     * More information:
     * https://github.com/bitpay/bitcore/pull/894
     * https://github.com/indutny/elliptic/issues/17
     * https://github.com/indutny/elliptic/pull/18
     * https://github.com/indutny/elliptic/pull/19
     */
    const p = Bn._prime('k256').p
    const red = Bn.red('k256')

    const n = new Bn(
      '9cd8cb48c3281596139f147c1364a3ede88d3f310fdb0eb98c924e599ca1b3c9',
      16
    )
    const expected = n.sqr().mod(p)
    const actual = n
      .toRed(red)
      .redSqr()
      .fromRed()

    assert.strict.equal(actual.toString(16), expected.toString(16))
  })

  it('should correctly square these numbers related to a bug in OpenSSL - CVE-2014-3570', function () {
    /**
     * Bitcoin developer Peter Wuile discovered a bug in OpenSSL in the course
     * of developing libsecp256k. The OpenSSL security advisory is here:
     *
     * https://www.openssl.org/news/secadv_20150108.txt
     *
     * Greg Maxwell has a description of the bug and how it was found here:
     *
     * https://www.reddit.com/r/Bitcoin/comments/2rrxq7/on_why_010s_release_notes_say_we_have_reason_to/
     * https://www.reddit.com/r/programming/comments/2rrc64/openssl_security_advisory_new_openssl_releases/
     *
     * The OpenSSL fix is here:
     *
     * https://github.com/openssl/openssl/commit/a7a44ba55cb4f884c6bc9ceac90072dea38e66d0
     *
     * This test uses the same big numbers that were problematic in OpenSSL.
     * The check is to ensure that squaring a number and multiplying it by
     * itself result in the same number. As an additional precaution, we check
     * this multiplication normally as well as mod(p).
     */
    const p = Bn._prime('k256').p

    let n = new Bn(
      '80000000000000008000000000000001FFFFFFFFFFFFFFFE0000000000000000',
      16
    )
    let sqr = n.sqr()
    let nn = n.mul(n)
    nn.toString().should.equal(sqr.toString())
    sqr = n.sqr().mod(p)
    nn = n.mul(n).mod(p)
    nn.toString().should.equal(sqr.toString())

    n = new Bn(
      '80000000000000000000000080000001FFFFFFFE000000000000000000000000',
      16
    )
    sqr = n.sqr()
    nn = n.mul(n)
    nn.toString().should.equal(sqr.toString())
    sqr = n.sqr().mod(p)
    nn = n.mul(n).mod(p)
    nn.toString().should.equal(sqr.toString())
  })

  describe('#copy', function () {
    it('should copy 5', function () {
      const bn = new Bn('5')
      let bn2
      ;(function () {
        bn.copy(bn2)
      }.should.throw()) // bn2 is not a Bn yet
      const bn3 = new Bn()
      bn.copy(bn3)
      bn3.toString().should.equal('5')
    })
  })

  describe('#neg', function () {
    it('should produce a negative', function () {
      const bn = new Bn(1).neg()
      ;(bn instanceof Bn).should.equal(true)
      bn.toString().should.equal('-1')
    })
  })

  describe('#add', function () {
    it('should add two small numbers together', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(75)
      const bn3 = bn1.add(bn2)
      bn3.toString().should.equal('125')
    })
  })

  describe('#sub', function () {
    it('should subtract a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(25)
      const bn3 = bn1.sub(bn2)
      bn3.toString().should.equal('25')
    })
  })

  describe('#mul', function () {
    it('should mul a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(25)
      const bn3 = bn1.mul(bn2)
      bn3.toString().should.equal('1250')
    })
  })

  describe('#mod', function () {
    it('should mod a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(25)
      const bn3 = bn1.mod(bn2)
      bn3.toString().should.equal('0')
    })

    it('should mod a small number', function () {
      const bn1 = new Bn(-50)
      const bn2 = new Bn(25)
      const bn3 = bn1.mod(bn2)
      bn3.toString().should.equal('0')
    })

    it('should mod a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(47)
      const bn3 = bn1.mod(bn2)
      bn3.toString().should.equal('3')
    })

    it('should mod a small number', function () {
      const bn1 = new Bn(-50)
      const bn2 = new Bn(47)
      const bn3 = bn1.mod(bn2)
      bn3.toString().should.equal('-3')
    })
  })

  describe('#umod', function () {
    it('should mod a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(25)
      const bn3 = bn1.umod(bn2)
      bn3.toString().should.equal('0')
    })

    it('should mod a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(47)
      const bn3 = bn1.umod(bn2)
      bn3.toString().should.equal('3')
    })
  })

  describe('#invm', function () {
    it('should invm a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(25)
      const bn3 = bn1.invm(bn2)
      bn3.toString().should.equal('0')
    })

    it('should invm a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(47)
      const bn3 = bn1.invm(bn2)
      bn3.toString().should.equal('16')
    })
  })

  describe('#div', function () {
    it('should div a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(25)
      const bn3 = bn1.div(bn2)
      bn3.toString().should.equal('2')
    })

    it('should div a small number', function () {
      const bn1 = new Bn(50)
      const bn2 = new Bn(47)
      const bn3 = bn1.div(bn2)
      bn3.toString().should.equal('1')
    })
  })

  describe('#cmp', function () {
    it('should know A=B', function () {
      new Bn(5).cmp(5).should.equal(0)
      new Bn(5).cmp(4).should.equal(1)
      new Bn(5).cmp(6).should.equal(-1)
    })
  })

  describe('#eq', function () {
    it('should know A=B', function () {
      new Bn(5).eq(5).should.equal(true)
      new Bn(5).eq(4).should.equal(false)
    })
  })

  describe('#neq', function () {
    it('should know A!=B', function () {
      new Bn(5).neq(5).should.equal(false)
      new Bn(5).neq(4).should.equal(true)
    })
  })

  describe('#gt', function () {
    it('should say 1 is greater than 0', function () {
      const bn1 = new Bn(1)
      const bn0 = new Bn(0)
      bn1.gt(bn0).should.equal(true)
    })

    it('should say a big number is greater than a small big number', function () {
      const bn1 = new Bn('24023452345398529485723980457')
      const bn0 = new Bn('34098234283412341234049357')
      bn1.gt(bn0).should.equal(true)
    })

    it('should say a big number is great than a standard number', function () {
      const bn1 = new Bn('24023452345398529485723980457')
      const bn0 = new Bn(5)
      bn1.gt(bn0).should.equal(true)
    })
  })

  describe('#geq', function () {
    it('should know that A >= B', function () {
      new Bn(6).geq(5).should.equal(true)
      new Bn(5).geq(5).should.equal(true)
      new Bn(4).geq(5).should.equal(false)
    })
  })

  describe('#lt', function () {
    it('should know A < B', function () {
      new Bn(5).lt(6).should.equal(true)
      new Bn(5).lt(4).should.equal(false)
    })
  })

  describe('#leq', function () {
    it('should know A <= B', function () {
      new Bn(5).leq(6).should.equal(true)
      new Bn(5).leq(5).should.equal(true)
      new Bn(5).leq(4).should.equal(false)
    })
  })

  describe('#fromJSON', function () {
    it('should make Bn from a string', function () {
      new Bn()
        .fromJSON('5')
        .toString()
        .should.equal('5')
    })
  })

  describe('#toJSON', function () {
    it('should make string from a Bn', function () {
      new Bn(5).toJSON().should.equal('5')
      new Bn()
        .fromJSON('5')
        .toJSON()
        .should.equal('5')
    })
  })

  describe('#fromString', function () {
    it('should make Bn from a string', function () {
      new Bn()
        .fromString('5')
        .toString()
        .should.equal('5')
    })
  })

  describe('#toString', function () {
    it('should make a string', function () {
      new Bn(5).toString().should.equal('5')
    })
  })

  describe('@fromBuffer', function () {
    it('should work with big endian', function () {
      const bn = Bn.fromBuffer(Buffer.from('0001', 'hex'), { endian: 'big' })
      bn.toString().should.equal('1')
    })

    it('should work with big endian 256', function () {
      const bn = Bn.fromBuffer(Buffer.from('0100', 'hex'), { endian: 'big' })
      bn.toString().should.equal('256')
    })

    it('should work with little endian if we specify the size', function () {
      const bn = Bn.fromBuffer(Buffer.from('0100', 'hex'), {
        size: 2,
        endian: 'little'
      })
      bn.toString().should.equal('1')
    })
  })

  describe('#fromHex', function () {
    it('should create bn from known hex', function () {
      const bn = new Bn().fromHex('0100', { size: 2, endian: 'little' })
      bn.toString().should.equal('1')
    })
  })

  describe('#fromBuffer', function () {
    it('should work as a prototype method', function () {
      const bn = new Bn().fromBuffer(Buffer.from('0100', 'hex'), {
        size: 2,
        endian: 'little'
      })
      bn.toString().should.equal('1')
    })
  })

  describe('#toHex', function () {
    it('should create a hex string of 4 byte buffer', function () {
      const bn = new Bn(1)
      bn.toHex({ size: 4 }).should.equal('00000001')
    })
  })

  describe('#toBuffer', function () {
    it('should convert zero to empty buffer', function () {
      new Bn(0).toBuffer().length.should.equal(0)
    })

    it('should create a 4 byte buffer', function () {
      const bn = new Bn(1)
      bn
        .toBuffer({ size: 4 })
        .toString('hex')
        .should.equal('00000001')
    })

    it('should create a 4 byte buffer in little endian', function () {
      const bn = new Bn(1)
      bn
        .toBuffer({ size: 4, endian: 'little' })
        .toString('hex')
        .should.equal('01000000')
    })

    it('should create a 2 byte buffer even if you ask for a 1 byte', function () {
      const bn = new Bn('ff00', 16)
      bn
        .toBuffer({ size: 1 })
        .toString('hex')
        .should.equal('ff00')
    })

    it('should create a 4 byte buffer even if you ask for a 1 byte', function () {
      const bn = new Bn('ffffff00', 16)
      bn
        .toBuffer({ size: 4 })
        .toString('hex')
        .should.equal('ffffff00')
    })
  })

  describe('#toBits', function () {
    it('should convert these known Bns to bits', function () {
      new Bn()
        .fromHex('00')
        .toBits()
        .should.equal(0x00000000)
      new Bn()
        .fromHex('01')
        .toBits()
        .should.equal(0x01000001)
      new Bn()
        .fromHex('0101')
        .toBits()
        .should.equal(0x02000101)
      new Bn()
        .fromHex('010101')
        .toBits()
        .should.equal(0x03010101)
      new Bn()
        .fromHex('01010101')
        .toBits()
        .should.equal(0x04010101)
      new Bn()
        .fromHex('0101010101')
        .toBits()
        .should.equal(0x05010101)
      new Bn()
        .fromHex('010101010101')
        .toBits()
        .should.equal(0x06010101)
      new Bn()
        .fromNumber(-1)
        .toBits()
        .should.equal(0x01800001)
    })
  })

  describe('#fromBits', function () {
    it('should convert these known bits to Bns', function () {
      new Bn()
        .fromBits(0x01003456)
        .toHex()
        .should.equal('')
      new Bn()
        .fromBits(0x02003456)
        .toHex()
        .should.equal('34')
      new Bn()
        .fromBits(0x03003456)
        .toHex()
        .should.equal('3456')
      new Bn()
        .fromBits(0x04003456)
        .toHex()
        .should.equal('345600')
      new Bn()
        .fromBits(0x05003456)
        .toHex()
        .should.equal('34560000')
      new Bn()
        .fromBits(0x05f03456)
        .lt(0)
        .should.equal(true) // sign bit set
      ;(function () {
        new Bn().fromBits(0x05f03456, { strict: true }) // sign bit set
      }.should.throw('negative bit set'))
      new Bn()
        .fromBits(0x04923456)
        .lt(0)
        .should.equal(true)
    })
  })

  describe('#toSm', function () {
    it('should convert to Sm', function () {
      let buf
      buf = new Bn().toSm()
      buf.toString('hex').should.equal('')
      buf = new Bn(5).toSm()
      buf.toString('hex').should.equal('05')
      buf = new Bn(-5).toSm()
      buf.toString('hex').should.equal('85')
      buf = new Bn(128).toSm()
      buf.toString('hex').should.equal('0080')
      buf = new Bn(-128).toSm()
      buf.toString('hex').should.equal('8080')
      buf = new Bn(127).toSm()
      buf.toString('hex').should.equal('7f')
      buf = new Bn(-127).toSm()
      buf.toString('hex').should.equal('ff')
      buf = new Bn(128).toSm({ endian: 'little' })
      buf.toString('hex').should.equal('8000')
      buf = new Bn(-128).toSm({ endian: 'little' })
      buf.toString('hex').should.equal('8080')
    })
  })

  describe('#fromSm', function () {
    it('should convert from Sm', function () {
      let buf
      buf = Buffer.from([0])
      new Bn()
        .fromSm(buf)
        .cmp(0)
        .should.equal(0)
      buf = Buffer.from('05', 'hex')
      new Bn()
        .fromSm(buf)
        .cmp(5)
        .should.equal(0)
      buf = Buffer.from('85', 'hex')
      new Bn()
        .fromSm(buf)
        .cmp(-5)
        .should.equal(0)
      buf = Buffer.from('0080', 'hex')
      new Bn()
        .fromSm(buf)
        .cmp(128)
        .should.equal(0)
      buf = Buffer.from('8080', 'hex')
      new Bn()
        .fromSm(buf)
        .cmp(-128)
        .should.equal(0)
      buf = Buffer.from('8000', 'hex')
      new Bn()
        .fromSm(buf, { endian: 'little' })
        .cmp(128)
        .should.equal(0)
      buf = Buffer.from('8080', 'hex')
      new Bn()
        .fromSm(buf, { endian: 'little' })
        .cmp(-128)
        .should.equal(0)
      buf = Buffer.from('0080', 'hex') // negative zero
      new Bn()
        .fromSm(buf, { endian: 'little' })
        .cmp(0)
        .should.equal(0)
    })
  })

  describe('#toScriptNumBuffer', function () {
    it('should output a little endian Sm number', function () {
      const bn = new Bn(-23434234)
      bn
        .toScriptNumBuffer()
        .toString('hex')
        .should.equal(bn.toSm({ endian: 'little' }).toString('hex'))
    })
  })

  describe('#fromScriptNumBuffer', function () {
    it('should parse this normal number', function () {
      new Bn()
        .fromScriptNumBuffer(Buffer.from('01', 'hex'))
        .toNumber()
        .should.equal(1)
      new Bn()
        .fromScriptNumBuffer(Buffer.from('0080', 'hex'))
        .toNumber()
        .should.equal(0)
      new Bn()
        .fromScriptNumBuffer(Buffer.from('0180', 'hex'))
        .toNumber()
        .should.equal(-1)
    })

    it('should throw an error for a number over 4 bytes', function () {
      ;(function () {
        new Bn()
          .fromScriptNumBuffer(Buffer.from('8100000000', 'hex'))
          .toNumber()
          .should.equal(-1)
      }.should.throw('script number overflow'))
    })

    it('should throw an error for number that is not a minimal size representation', function () {
      // invalid
      ;(function () {
        new Bn().fromScriptNumBuffer(Buffer.from('80000000', 'hex'), true)
      }.should.throw('non-minimally encoded script number'))
      ;(function () {
        new Bn().fromScriptNumBuffer(Buffer.from('800000', 'hex'), true)
      }.should.throw('non-minimally encoded script number'))
      ;(function () {
        new Bn().fromScriptNumBuffer(Buffer.from('00', 'hex'), true)
      }.should.throw('non-minimally encoded script number'))

      // valid
      new Bn()
        .fromScriptNumBuffer(Buffer.from('8000', 'hex'), true)
        .toString()
        .should.equal('128')
      new Bn()
        .fromScriptNumBuffer(Buffer.from('0081', 'hex'), true)
        .toString()
        .should.equal('-256')
      new Bn()
        .fromScriptNumBuffer(Buffer.from('', 'hex'), true)
        .toString()
        .should.equal('0')
      new Bn()
        .fromScriptNumBuffer(Buffer.from('01', 'hex'), true)
        .toString()
        .should.equal('1')

      // invalid, but flag not set
      new Bn()
        .fromScriptNumBuffer(Buffer.from('00000000', 'hex'))
        .toString()
        .should.equal('0')
    })
  })

  describe('#fromNumber', function () {
    it('should convert from a number', function () {
      new Bn()
        .fromNumber(5)
        .toNumber()
        .should.equal(5)
    })
  })

  describe('#toNumber', function () {
    it('it should convert to a number', function () {
      new Bn(5).toNumber().should.equal(5)
    })
  })
})
