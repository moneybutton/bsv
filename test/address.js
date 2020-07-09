/* global describe,it */
'use strict'
import { Address } from '../lib/address'
import { Constants } from '../lib/constants'
import { PrivKey } from '../lib/priv-key'
import { PubKey } from '../lib/pub-key'
import { Script } from '../lib/script'
import should from 'should'

describe('Address', function () {
  const pubKeyHash = Buffer.from(
    '3c3fa3d4adcaf8f52d5b1843975e122548269937',
    'hex'
  )
  const versionByteNum = 0
  const buf = Buffer.concat([Buffer.from([0]), pubKeyHash])
  const str = '16VZnHwRhwrExfeHFHGjwrgEMq8VcYPs9r'

  it('should satisfy these basic API features', function () {
    let address = new Address()
    should.exist(address)
    address = new Address()
    should.exist(address)
    address = new Address(versionByteNum, pubKeyHash)
    should.exist(address)
    new Address().constructor.should.equal(new Address().constructor)
    new Address.Testnet().constructor.should.equal(
      new Address.Testnet().constructor
    )
    const testAddr = Address.Testnet.fromRandom().toString()
    ;(testAddr[0] === 'm' || testAddr[0] === 'n').should.equal(true)
  })

  describe('@isValid', function () {
    it('should validate this valid address string', function () {
      Address.isValid(str).should.equal(true)
    })

    it('should invalidate this valid address string', function () {
      Address.isValid(str.substr(1)).should.equal(false)
    })
  })

  describe('#fromHex', function () {
    it('should make an address from a hex string', function () {
      new Address()
        .fromHex(buf.toString('hex'))
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
      new Address()
        .fromHex(buf.toString('hex'))
        .toString()
        .should.equal(str)
    })
  })

  describe('#fromBuffer', function () {
    it('should make an address from a buffer', function () {
      new Address()
        .fromBuffer(buf)
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
      new Address()
        .fromBuffer(buf)
        .toString()
        .should.equal(str)
    })

    it('should throw for invalid buffers', function () {
      ;(function () {
        new Address().fromBuffer(Buffer.concat([buf, Buffer.from([0])]))
      }.should.throw('address buffers must be exactly 21 bytes'))
      ;(function () {
        const buf2 = Buffer.from(buf)
        buf2[0] = 50
        new Address().fromBuffer(buf2)
      }.should.throw('address: invalid versionByteNum byte'))
    })
  })

  describe('@fromBuffer', function () {
    it('should make an address from a buffer', function () {
      Address.fromBuffer(buf)
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
      Address.fromBuffer(buf)
        .toString()
        .should.equal(str)
    })

    it('should throw for invalid buffers', function () {
      ;(function () {
        Address.fromBuffer(Buffer.concat([buf, Buffer.from([0])]))
      }.should.throw('address buffers must be exactly 21 bytes'))
      ;(function () {
        const buf2 = Buffer.from(buf)
        buf2[0] = 50
        Address.fromBuffer(buf2)
      }.should.throw('address: invalid versionByteNum byte'))
    })
  })

  describe('#fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      const buf = Buffer.alloc(20)
      buf.fill(0)
      const address = new Address().fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('@fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      const buf = Buffer.alloc(20)
      buf.fill(0)
      const address = Address.fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      const pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      const address = new Address()
      address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      const pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      const address = new Address()
      pubKey.compressed = false
      address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('@fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      const pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      const address = Address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      const pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      pubKey.compressed = false
      const address = Address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('#asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', async function () {
      const pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      const address1 = new Address().fromPubKey(pubKey)
      const address2 = await new Address().asyncFromPubKey(pubKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', async function () {
      const pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      const address1 = Address.fromPubKey(pubKey)
      const address2 = await Address.asyncFromPubKey(pubKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#fromPrivKey', function () {
    it('should make this address from a compressed pubKey', function () {
      const privKey = new PrivKey().fromRandom()
      const pubKey = new PubKey().fromPrivKey(privKey)
      const address = new Address().fromPrivKey(privKey)
      const address2 = new Address().fromPubKey(pubKey)
      address.toString().should.equal(address2.toString())
    })
  })

  describe('@fromPrivKey', function () {
    it('should make this address from a compressed pubKey using static method', function () {
      const privKey = new PrivKey().fromRandom()
      const pubKey = new PubKey().fromPrivKey(privKey)
      const address = Address.fromPrivKey(privKey)
      const address2 = Address.fromPubKey(pubKey)
      address.toString().should.equal(address2.toString())
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should asynchronously convert privKey to address same as fromPrivKey', async function () {
      const privKey = new PrivKey().fromRandom()
      const address1 = new Address().fromPrivKey(privKey)
      const address2 = await new Address().asyncFromPrivKey(privKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should asynchronously convert privKey to address same as fromPrivKey', async function () {
      const privKey = new PrivKey().fromRandom()
      const address1 = Address.fromPrivKey(privKey)
      const address2 = await Address.asyncFromPrivKey(privKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#fromRandom', function () {
    it('should make an address from random', function () {
      const address = new Address().fromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('@fromRandom', function () {
    it('should make an address from random using static method', function () {
      const address = Address.fromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('#asyncFromRandom', function () {
    it('should asynchronously make an address from random', async function () {
      const address = await new Address().asyncFromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('@asyncFromRandom', function () {
    it('should asynchronously make an address from random using static method', async function () {
      const address = await Address.asyncFromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('@fromTxInScript', function () {
    it('should make this address from an input script', function () {
      const script = Script.fromAsmString('3045022100ff812330880f443637e93ae1045985de38a29e26e4e589db84e86d0f17069f9a02203ed91e19a8cfa5e406bed1becc0e292c89346f9102358317e3238cb394a9ab0b 020536acad4d0763f39718143494811f5c0ffd39f5dc3667cfe3b4a7815b331a17')
      const address = Address.fromTxInScript(script)
      address.toString().should.equal('1EyV93Vhz4YLdfb67UaNujrBkd9CC6zvgG')
    })

    it('should make this address from a zero length public key', function () {
      const script = Script.fromAsmString('3045022100ff812330880f443637e93ae1045985de38a29e26e4e589db84e86d0f17069f9a02203ed91e19a8cfa5e406bed1becc0e292c89346f9102358317e3238cb394a9ab0b 0')
      const address = Address.fromTxInScript(script)
      address.toString().should.equal('1HqoNfpAJFMy9E36DBSk1ktPQ9o9fn2RxX')
    })
  })

  describe('@fromTxOutScript', function () {
    it('should make this address from a script', function () {
      Address.fromPubKeyHashBuf(Buffer.from('6fa5502ea094d59576898b490d866b32a61b89f6', 'hex')).toString()
        .should.equal('1BBL3TUavUCRauDreKv2JJ1CPgnyNxVHpA')
    })

    it('should make an address from a hashBuf', function () {
      const buf = Buffer.alloc(20)
      buf.fill(0)
      let address = new Address().fromPubKeyHashBuf(buf)
      const script = address.toTxOutScript()
      address = Address.fromTxOutScript(script)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#fromString', function () {
    it('should derive from this known address string mainnet', function () {
      const address = new Address()
      address.fromString(str)
      address
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
    })

    it('should derive from this known address string testnet', function () {
      const address = new Address.Testnet()
      address.fromString('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
      address.versionByteNum = Constants.Testnet.Address.pubKeyHash
      address.fromString(address.toString())
      address.toString().should.equal('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
    })
  })

  describe('@fromString', function () {
    it('should derive from this known address string mainnet', function () {
      const address = Address.fromString(str)
      address
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#asyncFromString', function () {
    it('should derive the same as fromString', async function () {
      const address1 = new Address().fromString(str)
      const address2 = await new Address().asyncFromString(str)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromString', function () {
    it('should derive the same as fromString', async function () {
      const address1 = Address.fromString(str)
      const address2 = await Address.asyncFromString(str)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#isValid', function () {
    it('should describe this valid address as valid', function () {
      const address = new Address()
      address.fromString('1111111111111111111114oLvT2')
      address.isValid().should.equal(true)
    })

    it('should describe this address with unknown versionByteNum as invalid', function () {
      const address = new Address()
      address.fromString('1111111111111111111114oLvT2')
      address.versionByteNum = 1
      address.isValid().should.equal(false)
    })
  })

  describe('#toHex', function () {
    it('should output this known hash', function () {
      const address = new Address()
      address.fromString(str)
      address
        .toHex()
        .slice(2)
        .should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should output this known hash', function () {
      const address = new Address()
      address.fromString(str)
      address
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toJSON', function () {
    it('should convert an address to json', function () {
      const addrbuf = Buffer.alloc(21)
      addrbuf.fill(0)
      const address = new Address().fromBuffer(addrbuf)
      const json = address.toJSON()
      should.exist(json.hashBuf)
      json.versionByteNum.should.equal(0)
    })
  })

  describe('#fromJSON', function () {
    it('should convert a json to an address', function () {
      const addrbuf = Buffer.alloc(21)
      addrbuf.fill(0)
      const address = new Address().fromBuffer(addrbuf)
      const json = address.toJSON()
      const address2 = new Address().fromJSON(json)
      should.exist(address2.hashBuf)
      address2.versionByteNum.should.equal(0)
    })
  })

  describe('#toTxOutScript', function () {
    it('should convert this address into known scripts', function () {
      const addrbuf = Buffer.alloc(21)
      addrbuf.fill(0)
      const addr = new Address().fromBuffer(addrbuf)
      const script = addr.toTxOutScript()
      script
        .toString()
        .should.equal(
          'OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG'
        )
    })
  })

  describe('#toString', function () {
    it('should output the same thing that was input', function () {
      const address = new Address()
      address.fromString(str)
      address.toString().should.equal(str)
    })
  })

  describe('#asyncToString', function () {
    it('should output the same as toString', async function () {
      const str1 = new Address().fromString(str).toString()
      const str2 = await new Address().fromString(str).asyncToString()
      str1.should.equal(str2)
    })
  })

  describe('#validate', function () {
    it('should not throw an error on this valid address', function () {
      const address = new Address()
      address.fromString(str)
      should.exist(address.validate())
    })

    it('should throw an error on this invalid versionByteNum', function () {
      const address = new Address()
      address.fromString(str)
      address.versionByteNum = 1
      ;(function () {
        address.validate()
      }.should.throw('invalid versionByteNum'))
    })

    it('should throw an error on this invalid versionByteNum', function () {
      const address = new Address()
      address.fromString(str)
      address.hashBuf = Buffer.concat([address.hashBuf, Buffer.from([0])])
      ;(function () {
        address.validate()
      }.should.throw('hashBuf must be a buffer of 20 bytes'))
    })
  })
})
