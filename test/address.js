/* global describe,it */
'use strict'
let Address = require('../lib/address')
let Constants = require('../lib/constants')
let Hash = require('../lib/hash')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let Script = require('../lib/script')
let should = require('should')

describe('Address', function () {
  let pubKeyHash = Buffer.from(
    '3c3fa3d4adcaf8f52d5b1843975e122548269937',
    'hex'
  )
  let versionByteNum = 0
  let buf = Buffer.concat([Buffer.from([0]), pubKeyHash])
  let str = '16VZnHwRhwrExfeHFHGjwrgEMq8VcYPs9r'

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
    let testAddr = Address.Testnet.fromRandom().toString()
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
        let buf2 = Buffer.from(buf)
        buf2[0] = 50
        new Address().fromBuffer(buf2)
      }.should.throw('address: invalid versionByteNum byte'))
    })

    it('should work with copay address type', function () {
      let addr = Address.fromRandom()
      addr = addr.toCopay()
      let buf = addr.toBuffer()
      let addr2 = new Address().fromBuffer(buf)
      addr2.isCopay().should.equal(true)
      addr2.versionByteNum.should.equal(addr.versionByteNum)
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
        let buf2 = Buffer.from(buf)
        buf2[0] = 50
        Address.fromBuffer(buf2)
      }.should.throw('address: invalid versionByteNum byte'))
    })

    it('should work with copay address type', function () {
      let addr = Address.fromRandom()
      addr = addr.toCopay()
      let buf = addr.toBuffer()
      let addr2 = Address.fromBuffer(buf)
      addr2.isCopay().should.equal(true)
      addr2.versionByteNum.should.equal(addr.versionByteNum)
    })
  })

  describe('#fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      let buf = Buffer.alloc(20)
      buf.fill(0)
      let address = new Address().fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('@fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      let buf = Buffer.alloc(20)
      buf.fill(0)
      let address = Address.fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      let address = new Address()
      address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      let address = new Address()
      pubKey.compressed = false
      address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('@fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      let address = Address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(
        Buffer.from(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
          'hex'
        )
      )
      pubKey.compressed = false
      let address = Address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('#asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', async function () {
      let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      let address1 = new Address().fromPubKey(pubKey)
      let address2 = await new Address().asyncFromPubKey(pubKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', async function () {
      let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      let address1 = Address.fromPubKey(pubKey)
      let address2 = await Address.asyncFromPubKey(pubKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#fromPrivKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let privKey = new PrivKey().fromRandom()
      let pubKey = new PubKey().fromPrivKey(privKey)
      let address = new Address().fromPrivKey(privKey)
      let address2 = new Address().fromPubKey(pubKey)
      address.toString().should.equal(address2.toString())
    })
  })

  describe('@fromPrivKey', function () {
    it('should make this address from a compressed pubKey using static method', function () {
      let privKey = new PrivKey().fromRandom()
      let pubKey = new PubKey().fromPrivKey(privKey)
      let address = Address.fromPrivKey(privKey)
      let address2 = Address.fromPubKey(pubKey)
      address.toString().should.equal(address2.toString())
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should asynchronously convert privKey to address same as fromPrivKey', async function () {
      let privKey = new PrivKey().fromRandom()
      let address1 = new Address().fromPrivKey(privKey)
      let address2 = await new Address().asyncFromPrivKey(privKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should asynchronously convert privKey to address same as fromPrivKey', async function () {
      let privKey = new PrivKey().fromRandom()
      let address1 = Address.fromPrivKey(privKey)
      let address2 = await Address.asyncFromPrivKey(privKey)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#fromRandom', function () {
    it('should make an address from random', function () {
      let address = new Address().fromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('@fromRandom', function () {
    it('should make an address from random using static method', function () {
      let address = Address.fromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('#asyncFromRandom', function () {
    it('should asynchronously make an address from random', async function () {
      let address = await new Address().asyncFromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('@asyncFromRandom', function () {
    it('should asynchronously make an address from random using static method', async function () {
      let address = await Address.asyncFromRandom()
      should.exist(address)
      ;(address instanceof Address).should.equal(true)
    })
  })

  describe('#fromRedeemScriptHashBuf', function () {
    it('should make this address from a script', function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let hashBuf = Hash.sha256Ripemd160(script.toBuffer())
      let address = new Address().fromRedeemScriptHashBuf(hashBuf)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })
  })

  describe('@fromRedeemScriptHashBuf', function () {
    it('should make this address from a script', function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let hashBuf = Hash.sha256Ripemd160(script.toBuffer())
      let address = Address.fromRedeemScriptHashBuf(hashBuf)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })
  })

  describe('#fromRedeemScript', function () {
    it('should make this address from a script', function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let address = new Address().fromRedeemScript(script)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })

    it('should make this address from other script', function () {
      let script = new Script().fromString('OP_CHECKSIG OP_HASH160')
      let address = new Address().fromRedeemScript(script)
      address.toString().should.equal('347iRqVwks5r493N1rsLN4k9J7Ljg488W7')
    })
  })

  describe('@fromRedeemScript', function () {
    it('should make this address from a script', function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let address = Address.fromRedeemScript(script)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })

    it('should make this address from other script', function () {
      let script = new Script().fromString('OP_CHECKSIG OP_HASH160')
      let address = Address.fromRedeemScript(script)
      address.toString().should.equal('347iRqVwks5r493N1rsLN4k9J7Ljg488W7')
    })
  })

  describe('@fromScript', function () {
    it('should make this address from a script', function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let address = Address.fromRedeemScript(script)
      script = address.toScript()
      address = Address.fromScript(script)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })

    it('should make an address from a hashBuf', function () {
      let buf = Buffer.alloc(20)
      buf.fill(0)
      let address = new Address().fromPubKeyHashBuf(buf)
      let script = address.toScript()
      address = Address.fromScript(script)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#asyncFromRedeemScript', function () {
    it('should derive the same as fromRedeemScript', async function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let address1 = new Address().fromRedeemScript(script)
      let address2 = await new Address().asyncFromRedeemScript(script)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromRedeemScript', function () {
    it('should derive the same as fromRedeemScript', async function () {
      let script = new Script().fromString('OP_CHECKMULTISIG')
      let address1 = Address.fromRedeemScript(script)
      let address2 = await Address.asyncFromRedeemScript(script)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#fromString', function () {
    it('should derive from this known address string mainnet', function () {
      let address = new Address()
      address.fromString(str)
      address
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
    })

    it('should derive from this known address string testnet', function () {
      let address = new Address.Testnet()
      address.fromString('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
      address.versionByteNum = Constants.Testnet.Address['pubKeyHash']
      address.fromString(address.toString())
      address.toString().should.equal('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
    })

    it('should derive from this known address string mainnet scriptHash', function () {
      let address = new Address()
      address.fromString(str)
      address.versionByteNum = Constants.Mainnet.Address['scriptHash']
      address.fromString(address.toString())
      address.toString().should.equal('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
    })

    it('should derive from this known address string testnet scriptHash', function () {
      let address = new Address.Testnet()
      address.fromString('2MxjnmaMtsJfyFcyG3WZCzS2RihdNuWqeX4')
      address.versionByteNum = Constants.Testnet.Address['scriptHash']
      address.fromString(address.toString())
      address.toString().should.equal('2MxjnmaMtsJfyFcyG3WZCzS2RihdNuWqeX4')
    })
  })

  describe('@fromString', function () {
    it('should derive from this known address string mainnet', function () {
      let address = Address.fromString(str)
      address
        .toBuffer()
        .slice(1)
        .toString('hex')
        .should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#asyncFromString', function () {
    it('should derive the same as fromString', async function () {
      let address1 = new Address().fromString(str)
      let address2 = await new Address().asyncFromString(str)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('@asyncFromString', function () {
    it('should derive the same as fromString', async function () {
      let address1 = Address.fromString(str)
      let address2 = await Address.asyncFromString(str)
      address1.toString().should.equal(address2.toString())
    })
  })

  describe('#isValid', function () {
    it('should describe this valid address as valid', function () {
      let address = new Address()
      address.fromString('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
      address.isValid().should.equal(true)
    })

    it('should describe this address with unknown versionByteNum as invalid', function () {
      let address = new Address()
      address.fromString('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
      address.versionByteNum = 1
      address.isValid().should.equal(false)
    })
  })

  describe('#isCopay', function () {
    it('should not default to copay', function () {
      Address.fromRandom()
        .isCopay()
        .should.equal(false)
    })

    it('should read in this copay address string', function () {
      let addr = Address.fromString('CQVzJuEHujhnmb2zq3nFus2PEW4m4BZRFW')
      addr.isCopay().should.equal(true)
    })

    it('should read in this copay p2sh address string', function () {
      let addr = Address.fromString('HM4UwaDKHCjL2nm6ELLxjsNNvDw1LszzFM')
      addr.isCopay().should.equal(true)
    })
  })

  describe('#toCopay', function () {
    it('should convert pubkeyhash to copay', function () {
      let addr = Address.fromRandom()
      addr = addr.toCopay()
      addr.toString()[0].should.equal('C')
      addr.isCopay().should.equal(true)
    })

    it('should convert p2sh to copay', function () {
      let script = Script.fromString('OP_0')
      let addr = Address.fromRedeemScript(script)
      addr = addr.toCopay()
      addr.toString()[0].should.equal('H')
      addr.isCopay().should.equal(true)
    })
  })

  describe('#type', function () {
    it('should give pubKeyHash for this address', function () {
      let addr = new Address().fromString(str)
      addr.type().should.equal('pubKeyHash')
      addr.versionByteNum = 1
      addr.type().should.equal('unknown')
    })

    it('should give scriptHash for this address', function () {
      let addr = new Address().fromString('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
      addr.type().should.equal('scriptHash')
    })

    it('should understand copay pubkeyhash', function () {
      let addr = Address.fromRandom()
      addr = addr.toCopay()
      addr.type().should.equal('pubKeyHash')
    })

    it('should understand copay p2sh', function () {
      let script = Script.fromString('OP_0')
      let addr = Address.fromRedeemScript(script)
      addr = addr.toCopay()
      addr.type().should.equal('scriptHash')
    })
  })

  describe('#toHex', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address
        .toHex()
        .slice(2)
        .should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should output this known hash', function () {
      let address = new Address()
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
      let addrbuf = Buffer.alloc(21)
      addrbuf.fill(0)
      let address = new Address().fromBuffer(addrbuf)
      let json = address.toJSON()
      should.exist(json.hashBuf)
      json.versionByteNum.should.equal(0)
    })
  })

  describe('#fromJSON', function () {
    it('should convert a json to an address', function () {
      let addrbuf = Buffer.alloc(21)
      addrbuf.fill(0)
      let address = new Address().fromBuffer(addrbuf)
      let json = address.toJSON()
      let address2 = new Address().fromJSON(json)
      should.exist(address2.hashBuf)
      address2.versionByteNum.should.equal(0)
    })
  })

  describe('#toScript', function () {
    it('should convert this address into known scripts', function () {
      let addrbuf = Buffer.alloc(21)
      addrbuf.fill(0)
      let addr = new Address().fromBuffer(addrbuf)
      let script = addr.toScript()
      script
        .toString()
        .should.equal(
          'OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG'
        )

      addr.versionByteNum = Constants.Mainnet.Address['scriptHash']
      script = addr.toScript()
      script
        .toString()
        .should.equal(
          'OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUAL'
        )

      addr.versionByteNum = 50
      ;(function () {
        script = addr.toScript()
      }.should.throw('script must be either pubKeyHash or scriptHash'))
    })
  })

  describe('#toString', function () {
    it('should output the same thing that was input', function () {
      let address = new Address()
      address.fromString(str)
      address.toString().should.equal(str)
    })
  })

  describe('#asyncToString', function () {
    it('should output the same as toString', async function () {
      let str1 = new Address().fromString(str).toString()
      let str2 = await new Address().fromString(str).asyncToString()
      str1.should.equal(str2)
    })
  })

  describe('#validate', function () {
    it('should not throw an error on this valid address', function () {
      let address = new Address()
      address.fromString(str)
      should.exist(address.validate())
    })

    it('should throw an error on this invalid versionByteNum', function () {
      let address = new Address()
      address.fromString(str)
      address.versionByteNum = 1
      ;(function () {
        address.validate()
      }.should.throw('invalid versionByteNum'))
    })

    it('should throw an error on this invalid versionByteNum', function () {
      let address = new Address()
      address.fromString(str)
      address.hashBuf = Buffer.concat([address.hashBuf, Buffer.from([0])])
      ;(function () {
        address.validate()
      }.should.throw('hashBuf must be a buffer of 20 bytes'))
    })

    it('should validate this copay address string', function () {
      let addr = Address.fromString('CQVzJuEHujhnmb2zq3nFus2PEW4m4BZRFW')
      addr.validate()
    })

    it('should validate this copay p2sh address string', function () {
      let addr = Address.fromString('HM4UwaDKHCjL2nm6ELLxjsNNvDw1LszzFM')
      addr.validate()
    })
  })
})
