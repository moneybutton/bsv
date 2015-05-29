"use strict";
let should = require('chai').should();
let KDF = require('../lib/kdf');
let Hash = require('../lib/hash');
let vectors = require('./vectors/kdf');

describe('KDF', function() {
  
  it('should satisfy this basic API', function() {
    KDF.Testnet.should.equal(KDF.Testnet);
    KDF.Mainnet.should.equal(KDF.Mainnet);
    KDF.Mainnet.should.not.equal(KDF.Testnet);
  });

  describe('@PBKDF2', function() {

    it('should return values of the right size', function() {
      let passbuf = new Buffer([0]);
      let saltbuf = new Buffer([0]);
      let key1 = KDF.PBKDF2(passbuf, saltbuf);
      key1.length.should.equal(512 / 8);
      let key2 = KDF.PBKDF2(passbuf, saltbuf, 2);
      key2.length.should.equal(512 / 8);
      key1.toString('hex').should.not.equal(key2.toString('hex'));
      let key3 = KDF.PBKDF2(passbuf, saltbuf, 2, 1024);
      key3.length.should.equal(1024 / 8);
      let key4 = KDF.PBKDF2(passbuf, saltbuf, 2, 256, 'sha256');
      key4.length.should.equal(256 / 8);
    });

    // Test vectors from: http://tools.ietf.org/html/rfc6070#section-2
    vectors.PBKDF2.valid.forEach(function(obj, i) {
      it('should work for PBKDF2 test vector ' + i, function() {
        let passbuf = new Buffer(obj.p, 'hex');
        let saltbuf = new Buffer(obj.s, 'hex');
        let niterations = obj.c;
        let keylenbits = obj.dkLen * 8;
        let hmacf = obj.hmacf;
        let key = KDF.PBKDF2(passbuf, saltbuf, niterations, keylenbits, hmacf);
        key.toString('hex').should.equal(obj.key);
      });
    });

  });
  
  describe('@buf2keypair', function() {

    it('should compute these known values', function() {
      let buf = Hash.sha256(new Buffer('test'));
      let keypair = KDF.buf2keypair(buf);
      keypair.privkey.toString().should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V');
      keypair.pubkey.toString().should.equal('03774f761ae89a0d2fda0d532bad62286ae8fcda9bc38c060036296085592a97c1');
    });

  });

  describe('@sha256hmac2keypair', function() {

    it('should compute these known values', function() {
      let buf = Hash.sha256(new Buffer('test'));
      let keypair = KDF.sha256hmac2keypair(buf);
      keypair.privkey.toString().should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V');
      keypair.pubkey.toString().should.equal('03774f761ae89a0d2fda0d532bad62286ae8fcda9bc38c060036296085592a97c1');
    });

  });

  describe('@sha256hmac2privkey', function() {

    it('should compute this known privkey', function() {
      let buf = Hash.sha256(new Buffer('test'));
      let privkey = KDF.sha256hmac2privkey(buf);
      privkey.toString().should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V');
    });

  });

});
