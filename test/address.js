/* global describe,it */
'use strict'
let Address = require('../lib/address')
let Constants = require('../lib/constants')
let Hash = require('../lib/hash')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let Script = require('../lib/script')
let asink = require('asink')
let should = require('chai').should()

describe('Address', function () {
  let pubKeyHash = new Buffer('3c3fa3d4adcaf8f52d5b1843975e122548269937', 'hex')
  let versionByteNum = 0
  let buf = Buffer.concat([new Buffer([0]), pubKeyHash])
  let str = '16VZnHwRhwrExfeHFHGjwrgEMq8VcYPs9r'

  it('should satisfy these basic API features', function () {
    let address = new Address()
    should.exist(address)
    address = new Address()
    should.exist(address)
    address = new Address(versionByteNum, pubKeyHash)
    should.exist(address)
    new Address().constructor.should.equal(new Address().constructor)
    new Address.Testnet().constructor.should.equal(new Address.Testnet().constructor)
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
      new Address().fromHex(buf.toString('hex')).toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
      new Address().fromHex(buf.toString('hex')).toString().should.equal(str)
    })
  })

  describe('#fromBuffer', function () {
    it('should make an address from a buffer', function () {
      new Address().fromBuffer(buf).toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
      new Address().fromBuffer(buf).toString().should.equal(str)
    })

    it('should throw for invalid buffers', function () {
      (function () {
        new Address().fromBuffer(Buffer.concat([buf, new Buffer([0])]))
      }).should.throw('address buffers must be exactly 21 bytes')
      ;(function () {
        let buf2 = new Buffer(buf)
        buf2[0] = 50
        new Address().fromBuffer(buf2)
      }).should.throw('invalid versionByteNum byte')
    })
  })

  describe('#fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      let buf = new Buffer(20)
      buf.fill(0)
      let address = new Address().fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('@fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      let buf = new Buffer(20)
      buf.fill(0)
      let address = Address.fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = new Address()
      address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = new Address()
      pubKey.compressed = false
      address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('@fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = Address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      pubKey.compressed = false
      let address = Address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('#asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', function () {
      return asink(function * () {
        let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
        let address1 = new Address().fromPubKey(pubKey)
        let address2 = yield new Address().asyncFromPubKey(pubKey)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('@asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', function () {
      return asink(function * () {
        let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
        let address1 = Address.fromPubKey(pubKey)
        let address2 = yield Address.asyncFromPubKey(pubKey)
        address1.toString().should.equal(address2.toString())
      }, this)
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
    it('should asynchronously convert privKey to address same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromRandom()
        let address1 = new Address().fromPrivKey(privKey)
        let address2 = yield new Address().asyncFromPrivKey(privKey)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should asynchronously convert privKey to address same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromRandom()
        let address1 = Address.fromPrivKey(privKey)
        let address2 = yield Address.asyncFromPrivKey(privKey)
        address1.toString().should.equal(address2.toString())
      }, this)
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

  describe('#asyncFromRedeemScript', function () {
    it('should derive the same as fromRedeemScript', function () {
      return asink(function * () {
        let script = new Script().fromString('OP_CHECKMULTISIG')
        let address1 = new Address().fromRedeemScript(script)
        let address2 = yield new Address().asyncFromRedeemScript(script)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('@asyncFromRedeemScript', function () {
    it('should derive the same as fromRedeemScript', function () {
      return asink(function * () {
        let script = new Script().fromString('OP_CHECKMULTISIG')
        let address1 = Address.fromRedeemScript(script)
        let address2 = yield Address.asyncFromRedeemScript(script)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('#fromString', function () {
    it('should derive from this known address string mainnet', function () {
      let address = new Address()
      address.fromString(str)
      address.toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
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
      address.toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#asyncFromString', function () {
    it('should derive the same as fromString', function () {
      return asink(function * () {
        let address1 = new Address().fromString(str)
        let address2 = yield new Address().asyncFromString(str)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('@asyncFromString', function () {
    it('should derive the same as fromString', function () {
      return asink(function * () {
        let address1 = Address.fromString(str)
        let address2 = yield Address.asyncFromString(str)
        address1.toString().should.equal(address2.toString())
      }, this)
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
  })

  describe('#toHex', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address.toHex().slice(2).should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address.toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toJSON', function () {
    it('should convert an address to json', function () {
      let addrbuf = new Buffer(21)
      addrbuf.fill(0)
      let address = new Address().fromBuffer(addrbuf)
      let json = address.toJSON()
      should.exist(json.hashBuf)
      json.versionByteNum.should.equal(0)
    })
  })

  describe('#fromJSON', function () {
    it('should convert a json to an address', function () {
      let addrbuf = new Buffer(21)
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
      let addrbuf = new Buffer(21)
      addrbuf.fill(0)
      let addr = new Address().fromBuffer(addrbuf)
      let script = addr.toScript()
      script.toString().should.equal('OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG')

      addr.versionByteNum = Constants.Mainnet.Address['scriptHash']
      script = addr.toScript()
      script.toString().should.equal('OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUAL')

      addr.versionByteNum = 50
      ;(function () {
        script = addr.toScript()
      }).should.throw('script must be either pubKeyHash or scriptHash')
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
    it('should output the same as toString', function () {
      return asink(function * () {
        let str1 = new Address().fromString(str).toString()
        let str2 = yield new Address().fromString(str).asyncToString()
        str1.should.equal(str2)
      }, this)
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
      }).should.throw('invalid versionByteNum')
    })

    it('should throw an error on this invalid versionByteNum', function () {
      let address = new Address()
      address.fromString(str)
      address.hashBuf = Buffer.concat([address.hashBuf, new Buffer([0])])
      ;(function () {
        address.validate()
      }).should.throw('hashBuf must be a buffer of 20 bytes')
    })
  })
})
