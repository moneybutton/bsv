/* global describe,it */
'use strict'
let Address = require('../lib/address')
let Constants = require('../lib/constants')
let Hash = require('../lib/hash')
let Pubkey = require('../lib/pubkey')
let Script = require('../lib/script')
let should = require('chai').should()

describe('Address', function () {
  let pubkeyhash = new Buffer('3c3fa3d4adcaf8f52d5b1843975e122548269937', 'hex')
  let version = 0
  let buf = Buffer.concat([new Buffer([0]), pubkeyhash])
  let str = '16VZnHwRhwrExfeHFHGjwrgEMq8VcYPs9r'

  it('should satisfy these basic API features', function () {
    let address = new Address()
    should.exist(address)
    address = Address()
    should.exist(address)
    address = Address(version, pubkeyhash)
    should.exist(address)
    Address().constructor.should.equal(Address().constructor)
    Address.Testnet().constructor.should.equal(Address.Testnet().constructor)
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
      Address().fromHex(buf.toString('hex')).toBuffer().slice(1).toString('hex').should.equal(pubkeyhash.toString('hex'))
      Address().fromHex(buf.toString('hex')).toString().should.equal(str)
    })
  })

  describe('#fromBuffer', function () {
    it('should make an address from a buffer', function () {
      Address().fromBuffer(buf).toBuffer().slice(1).toString('hex').should.equal(pubkeyhash.toString('hex'))
      Address().fromBuffer(buf).toString().should.equal(str)
    })

    it('should throw for invalid buffers', function () {
      (function () {
        Address().fromBuffer(Buffer.concat([buf, new Buffer([0])]))
      }).should.throw('address buffers must be exactly 21 bytes')
      ;(function () {
        let buf2 = new Buffer(buf)
        buf2[0] = 50
        Address().fromBuffer(buf2)
      }).should.throw('invalid version byte')
    })
  })

  describe('#fromPubkeyHashbuf', function () {
    it('should make an address from a hashbuf', function () {
      let buf = new Buffer(20)
      buf.fill(0)
      let address = Address().fromPubkeyHashbuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#fromPubkey', function () {
    it('should make this address from a compressed pubkey', function () {
      let pubkey = new Pubkey()
      pubkey.fromDER(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = new Address()
      address.fromPubkey(pubkey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubkey', function () {
      let pubkey = new Pubkey()
      pubkey.fromDER(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = new Address()
      pubkey.compressed = false
      address.fromPubkey(pubkey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('#fromRedeemScriptHashbuf', function () {
    it('should make this address from a script', function () {
      let script = Script().fromString('OP_CHECKMULTISIG')
      let hashbuf = Hash.sha256ripemd160(script.toBuffer())
      let address = Address().fromRedeemScriptHashbuf(hashbuf)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })
  })

  describe('#fromRedeemScript', function () {
    it('should make this address from a script', function () {
      let script = Script().fromString('OP_CHECKMULTISIG')
      let address = Address().fromRedeemScript(script)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })

    it('should make this address from other script', function () {
      let script = Script().fromString('OP_CHECKSIG OP_HASH160')
      let address = Address().fromRedeemScript(script)
      address.toString().should.equal('347iRqVwks5r493N1rsLN4k9J7Ljg488W7')
    })
  })

  describe('#fromString', function () {
    it('should derive from this known address string mainnet', function () {
      let address = new Address()
      address.fromString(str)
      address.toBuffer().slice(1).toString('hex').should.equal(pubkeyhash.toString('hex'))
    })

    it('should derive from this known address string testnet', function () {
      let address = new Address.Testnet()
      address.fromString('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
      address.version = Constants.Testnet.Address['pubkeyhash']
      address.fromString(address.toString())
      address.toString().should.equal('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
    })

    it('should derive from this known address string mainnet scripthash', function () {
      let address = new Address()
      address.fromString(str)
      address.version = Constants.Mainnet.Address['scripthash']
      address.fromString(address.toString())
      address.toString().should.equal('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
    })

    it('should derive from this known address string testnet scripthash', function () {
      let address = new Address.Testnet()
      address.fromString('2MxjnmaMtsJfyFcyG3WZCzS2RihdNuWqeX4')
      address.version = Constants.Testnet.Address['scripthash']
      address.fromString(address.toString())
      address.toString().should.equal('2MxjnmaMtsJfyFcyG3WZCzS2RihdNuWqeX4')
    })
  })

  describe('#isValid', function () {
    it('should describe this valid address as valid', function () {
      let address = new Address()
      address.fromString('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
      address.isValid().should.equal(true)
    })

    it('should describe this address with unknown version as invalid', function () {
      let address = new Address()
      address.fromString('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
      address.version = 1
      address.isValid().should.equal(false)
    })
  })

  describe('#type', function () {
    it('should give pubkeyhash for this address', function () {
      let addr = Address().fromString(str)
      addr.type().should.equal('pubkeyhash')
      addr.version = 1
      addr.type().should.equal('unknown')
    })

    it('should give scripthash for this address', function () {
      let addr = Address().fromString('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
      addr.type().should.equal('scripthash')
    })
  })

  describe('#toHex', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address.toHex().slice(2).should.equal(pubkeyhash.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address.toBuffer().slice(1).toString('hex').should.equal(pubkeyhash.toString('hex'))
    })
  })

  describe('#toScript', function () {
    it('should convert this address into known scripts', function () {
      let addrbuf = new Buffer(21)
      addrbuf.fill(0)
      let addr = Address().fromBuffer(addrbuf)
      let script = addr.toScript()
      script.toString().should.equal('OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG')

      addr.version = Constants.Mainnet.Address['scripthash']
      script = addr.toScript()
      script.toString().should.equal('OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUAL')

      addr.version = 50
      ;(function () {
        script = addr.toScript()
      }).should.throw('script must be either pubkeyhash or scripthash')
    })
  })

  describe('#toString', function () {
    it('should output the same thing that was input', function () {
      let address = new Address()
      address.fromString(str)
      address.toString().should.equal(str)
    })
  })

  describe('#validate', function () {
    it('should not throw an error on this valid address', function () {
      let address = new Address()
      address.fromString(str)
      should.exist(address.validate())
    })

    it('should throw an error on this invalid version', function () {
      let address = new Address()
      address.fromString(str)
      address.version = 1
      ;(function () {
        address.validate()
      }).should.throw('invalid version')
    })

    it('should throw an error on this invalid version', function () {
      let address = new Address()
      address.fromString(str)
      address.hashbuf = Buffer.concat([address.hashbuf, new Buffer([0])])
      ;(function () {
        address.validate()
      }).should.throw('hashbuf must be a buffer of 20 bytes')
    })
  })
})
