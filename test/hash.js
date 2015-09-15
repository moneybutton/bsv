'use strict'
let should = require('chai').should()
let Hash = require('../lib/hash')
let vectors = require('./vectors/hash')

describe('Hash', function () {
  let buf = new Buffer([0, 1, 2, 3, 253, 254, 255])
  let str = 'test string'

  it('should have the blocksize for some hash functions', function () {
    Hash.sha1.blocksize.should.equal(512)
    Hash.sha256.blocksize.should.equal(512)
    Hash.sha512.blocksize.should.equal(1024)
  })

  describe('@hmac', function () {
    it('should throw errors in these cases', function () {
      (function () {
        Hash.hmac('non-supported-hash-function', new Buffer([]), new Buffer([]))
      }).should.throw('invalid choice of hash function');(function () {
        Hash.hmac('sha512', new Buffer([]), '')
      }).should.throw('data and key must be buffers');(function () {
        Hash.hmac('sha512', '', new Buffer([]))
      }).should.throw('data and key must be buffers')
    })

  })

  describe('@sha1', function () {
    it('should calculate the hash of this buffer correctly', function () {
      let hash = Hash.sha1(buf)
      hash.toString('hex').should.equal('de69b8a4a5604d0486e6420db81e39eb464a17b2')
      hash = Hash.sha1(new Buffer(0))
      hash.toString('hex').should.equal('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    })

    it('should throw an error when the input is not a buffer', function () {
      (function () {
        Hash.sha1(str)
      }).should.throw('sha1 hash must be of a buffer')
    })

  })

  describe('@sha1hmac', function () {
    // http://tools.ietf.org/html/rfc2202.html

    it('should calculate this known empty test vector correctly', function () {
      let hex = 'b617318655057264e28bc0b6fb378c8ef146be00'
      Hash.sha1hmac(new Buffer('Hi There'), new Buffer('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b', 'hex')).toString('hex').should.equal(hex)
    })

  })

  describe('@sha256', function () {
    it('should calculate the hash of this buffer correctly', function () {
      let hash = Hash.sha256(buf)
      hash.toString('hex').should.equal('6f2c7b22fd1626998287b3636089087961091de80311b9279c4033ec678a83e8')
    })

    it('should throw an error when the input is not a buffer', function () {
      (function () {
        Hash.sha256(str)
      }).should.throw('sha256 hash must be of a buffer')
    })

  })

  describe('@sha256hmac', function () {
    it('should compute this known empty test vector correctly', function () {
      let key = new Buffer('')
      let data = new Buffer('')
      Hash.sha256hmac(data, key).toString('hex').should.equal('b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad')
    })

    it('should compute this known non-empty test vector correctly', function () {
      let key = new Buffer('key')
      let data = new Buffer('The quick brown fox jumps over the lazy dog')
      Hash.sha256hmac(data, key).toString('hex').should.equal('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8')
    })

  })

  describe('@sha256sha256', function () {
    it('should calculate the hash of this buffer correctly', function () {
      let hash = Hash.sha256sha256(buf)
      hash.toString('hex').should.equal('be586c8b20dee549bdd66018c7a79e2b67bb88b7c7d428fa4c970976d2bec5ba')
    })

    it('should throw an error when the input is not a buffer', function () {
      (function () {
        Hash.sha256sha256(str)
      }).should.throw('sha256sha256 hash must be of a buffer')
    })

  })

  describe('@sha256ripemd160', function () {
    it('should calculate the hash of this buffer correctly', function () {
      let hash = Hash.sha256ripemd160(buf)
      hash.toString('hex').should.equal('7322e2bd8535e476c092934e16a6169ca9b707ec')
    })

    it('should throw an error when the input is not a buffer', function () {
      (function () {
        Hash.sha256ripemd160(str)
      }).should.throw('sha256ripemd160 hash must be of a buffer')
    })

  })

  describe('@ripemd160', function () {
    it('should calculate the hash of this buffer correctly', function () {
      let hash = Hash.ripemd160(buf)
      hash.toString('hex').should.equal('fa0f4565ff776fee0034c713cbf48b5ec06b7f5c')
    })

    it('should throw an error when the input is not a buffer', function () {
      (function () {
        Hash.ripemd160(str)
      }).should.throw('ripemd160 hash must be of a buffer')
    })

  })

  describe('@sha512', function () {
    it('should calculate the hash of this buffer correctly', function () {
      let hash = Hash.sha512(buf)
      hash.toString('hex').should.equal('c0530aa32048f4904ae162bc14b9eb535eab6c465e960130005feddb71613e7d62aea75f7d3333ba06e805fc8e45681454524e3f8050969fe5a5f7f2392e31d0')
    })

    it('should throw an error when the input is not a buffer', function () {
      (function () {
        Hash.sha512(str)
      }).should.throw('sha512 hash must be of a buffer')
    })

  })

  describe('@sha512hmac', function () {
    it('should calculate this value where key size is the same as block size', function () {
      let key = new Buffer(Hash.sha512.blocksize / 8)
      key.fill(0)
      let data = new Buffer([])
      // test vector calculated with node's createHmac
      let hex = 'b936cee86c9f87aa5d3c6f2e84cb5a4239a5fe50480a6ec66b70ab5b1f4ac6730c6c515421b327ec1d69402e53dfb49ad7381eb067b338fd7b0cb22247225d47'
      Hash.sha512hmac(data, key).toString('hex').should.equal(hex)
    })

    it('should calculate this known empty test vector correctly', function () {
      let hex = 'b936cee86c9f87aa5d3c6f2e84cb5a4239a5fe50480a6ec66b70ab5b1f4ac6730c6c515421b327ec1d69402e53dfb49ad7381eb067b338fd7b0cb22247225d47'
      Hash.sha512hmac(new Buffer([]), new Buffer([])).toString('hex').should.equal(hex)
    })

    it('should calculate this known non-empty test vector correctly', function () {
      let hex = 'c40bd7c15aa493b309c940e08a73ffbd28b2e4cb729eb94480d727e4df577b13cc403a78e6150d83595f3b17c4cc331f12ca5952691de3735a63c1d4c69a2bac'
      let data = new Buffer('test1')
      let key = new Buffer('test2')
      Hash.sha512hmac(data, key).toString('hex').should.equal(hex)
    })

  })

  describe('vectors', function () {
    vectors.sha1.forEach(function (vector, i) {
      it('should pass sjcl sha1 test vector ' + i, function () {
        let data = new Buffer(vector[0])
        let hashbuf = new Buffer(vector[1], 'hex')
        Hash.sha1(data).toString('hex').should.equal(vector[1])
      })
    })

    vectors.sha256.forEach(function (vector, i) {
      it('should pass sjcl sha256 test vector ' + i, function () {
        let data = new Buffer(vector[0])
        let hashbuf = new Buffer(vector[1], 'hex')
        Hash.sha256(data).toString('hex').should.equal(vector[1])
      })
    })

    vectors.sha512.forEach(function (vector, i) {
      it('should pass sjcl sha512 test vector ' + i, function () {
        let data = new Buffer(vector[0])
        let hashbuf = new Buffer(vector[1], 'hex')
        Hash.sha512(data).toString('hex').should.equal(vector[1])
      })
    })

    vectors.hmac.forEach(function (vector, i) {
      it('should pass standard hmac test vector ' + i, function () {
        let keybuf = new Buffer(vector.key, 'hex')
        let databuf = new Buffer(vector.data, 'hex')
        Hash.sha256hmac(databuf, keybuf).toString('hex').substr(0, vector.sha256hmac.length).should.equal(vector.sha256hmac)
        Hash.sha512hmac(databuf, keybuf).toString('hex').substr(0, vector.sha512hmac.length).should.equal(vector.sha512hmac)
      })
    })

  })

})
