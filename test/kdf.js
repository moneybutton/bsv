"use strict";
var should = require('chai').should();
var KDF = require('../lib/kdf');
var Hash = require('../lib/hash');
var vectors = require('./vectors/kdf');

describe('KDF', function() {

  describe('@PBKDF2', function() {

    it('should return values of the right size', function() {
      var passbuf = new Buffer([0]);
      var saltbuf = new Buffer([0]);
      var key1 = KDF.PBKDF2(passbuf, saltbuf);
      key1.length.should.equal(512 / 8);
      var key2 = KDF.PBKDF2(passbuf, saltbuf, 2);
      key2.length.should.equal(512 / 8);
      key1.toString('hex').should.not.equal(key2.toString('hex'));
      var key3 = KDF.PBKDF2(passbuf, saltbuf, 2, 1024);
      key3.length.should.equal(1024 / 8);
      var key4 = KDF.PBKDF2(passbuf, saltbuf, 2, 256, 'sha256');
      key4.length.should.equal(256 / 8);
    });

    // Test vectors from: http://tools.ietf.org/html/rfc6070#section-2
    vectors.PBKDF2.valid.forEach(function(obj, i) {
      it('should work for PBKDF2 test vector ' + i, function() {
        var passbuf = new Buffer(obj.p, 'hex');
        var saltbuf = new Buffer(obj.s, 'hex');
        var niterations = obj.c;
        var keylenbits = obj.dkLen * 8;
        var hmacf = obj.hmacf;
        var key = KDF.PBKDF2(passbuf, saltbuf, niterations, keylenbits, hmacf);
        key.toString('hex').should.equal(obj.key);
      });
    });

  });
  
  describe('@buf2keypair', function() {

    it('should compute these known values', function() {
      var buf = Hash.sha256(new Buffer('test'));
      var keypair = KDF.buf2keypair(buf);
      keypair.privkey.toString().should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V');
      keypair.pubkey.toString().should.equal('03774f761ae89a0d2fda0d532bad62286ae8fcda9bc38c060036296085592a97c1');
    });

  });

  describe('@sha256hmac2keypair', function() {

    it('should compute these known values', function() {
      var buf = Hash.sha256(new Buffer('test'));
      var keypair = KDF.sha256hmac2keypair(buf);
      keypair.privkey.toString().should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V');
      keypair.pubkey.toString().should.equal('03774f761ae89a0d2fda0d532bad62286ae8fcda9bc38c060036296085592a97c1');
    });

  });

  describe('@sha256hmac2privkey', function() {

    it('should compute this known privkey', function() {
      var buf = Hash.sha256(new Buffer('test'));
      var privkey = KDF.sha256hmac2privkey(buf);
      privkey.toString().should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V');
    });

  });

});
