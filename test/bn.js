"use strict";
let chai = require('chai');
let should = chai.should();
let assert = chai.assert;
let BN = require('../lib/bn');

describe('BN', function() {
  it('should create a bn', function() {
    let bn = new BN(50);
    should.exist(bn);
    bn.toString().should.equal('50');
    bn = BN(50);
    bn.toString().should.equal('50');
    (bn instanceof BN).should.equal(true);
    bn = BN('ff00', 16);
    bn.toString(16).should.equal('ff00');
    bn = new BN('ff00', 16);
    bn.toString(16).should.equal('ff00');
  });

  it('should parse this number', function() {
    let bn = BN(999970000);
    bn.toString().should.equal('999970000');
  });

  it('should parse numbers below and at bn.js internal word size', function() {
    let bn = BN(Math.pow(2, 26) - 1);
    bn.toString().should.equal((Math.pow(2, 26) - 1).toString());
    bn = BN(Math.pow(2, 26));
    bn.toString().should.equal((Math.pow(2, 26)).toString());
  });

  it('should correctly square the number related to a bug in bn.js', function() {
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
    let p = BN._prime('k256').p;
    let red = BN.red('k256');
   
    let n = new BN('9cd8cb48c3281596139f147c1364a3ede88d3f310fdb0eb98c924e599ca1b3c9', 16);
    let expected = n.sqr().mod(p);
    let actual = n.toRed(red).redSqr().fromRed();
   
    assert.equal(actual.toString(16), expected.toString(16));
  });

  it('should correctly square these numbers related to a bug in OpenSSL - CVE-2014-3570', function() {
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
    let p = BN._prime('k256').p;

    let n = BN('80000000000000008000000000000001FFFFFFFFFFFFFFFE0000000000000000', 16);
    let sqr = n.sqr();
    let nn = n.mul(n);
    nn.toString().should.equal(sqr.toString());
    sqr = n.sqr().mod(p);
    nn = n.mul(n).mod(p);
    nn.toString().should.equal(sqr.toString());

    n = BN('80000000000000000000000080000001FFFFFFFE000000000000000000000000', 16);
    sqr = n.sqr();
    nn = n.mul(n);
    nn.toString().should.equal(sqr.toString());
    sqr = n.sqr().mod(p);
    nn = n.mul(n).mod(p);
    nn.toString().should.equal(sqr.toString());
  });

  describe('#copy', function() {
    
    it('should copy 5', function() {
      let bn = BN('5');
      let bn2;
      (function() {
        bn.copy(bn2);
      }).should.throw(); //bn2 is not a BN yet
      bn2 = BN();
      bn.copy(bn2);
      bn2.toString().should.equal('5');
    });

  });
  
  describe('#add', function() {

    it('should add two small numbers together', function() {
      let bn1 = BN(50);
      let bn2 = BN(75);
      let bn3 = bn1.add(bn2);
      bn3.toString().should.equal('125');
    });

  });

  describe('#sub', function() {

    it('should subtract a small number', function() {
      let bn1 = BN(50);
      let bn2 = BN(25);
      let bn3 = bn1.sub(bn2);
      bn3.toString().should.equal('25');
    });

  });

  describe('#eq', function() {

    it('should know A=B', function() {
      BN(5).eq(5).should.equal(true);
      BN(5).eq(4).should.equal(false);
    });

  });

  describe('#neq', function() {

    it('should know A!=B', function() {
      BN(5).neq(5).should.equal(false);
      BN(5).neq(4).should.equal(true);
    });

  });

  describe('#gt', function() {

    it('should say 1 is greater than 0', function() {
      let bn1 = BN(1);
      let bn0 = BN(0);
      bn1.gt(bn0).should.equal(true);
    });

    it('should say a big number is greater than a small big number', function() {
      let bn1 = BN('24023452345398529485723980457');
      let bn0 = BN('34098234283412341234049357');
      bn1.gt(bn0).should.equal(true);
    });

    it('should say a big number is great than a standard number', function() {
      let bn1 = BN('24023452345398529485723980457');
      let bn0 = BN(5);
      bn1.gt(bn0).should.equal(true);
    });

  });

  describe('#geq', function() {

    it('should know that A >= B', function() {
      BN(6).geq(5).should.equal(true);
      BN(5).geq(5).should.equal(true);
      BN(4).geq(5).should.equal(false);
    });

  });

  describe('#lt', function() {
    
    it('should know A < B', function() {
      BN(5).lt(6).should.equal(true);
      BN(5).lt(4).should.equal(false);
    });

  });

  describe('#leq', function() {
    
    it('should know A <= B', function() {
      BN(5).leq(6).should.equal(true);
      BN(5).leq(5).should.equal(true);
      BN(5).leq(4).should.equal(false);
    });

  });

  describe('#fromJSON', function() {
    
    it('should make BN from a string', function() {
      BN().fromJSON('5').toString().should.equal('5');
    });

  });

  describe('#toJSON', function() {
    
    it('should make string from a BN', function() {
      BN(5).toJSON().should.equal('5');
      BN().fromJSON('5').toJSON().should.equal('5');
    });

  });

  describe('#fromString', function() {
    
    it('should make BN from a string', function() {
      BN().fromString('5').toString().should.equal('5');
    });

  });

  describe('#toString', function() {
    
    it('should make a string', function() {
      BN(5).toString().should.equal('5');
    });

  });

  describe('@fromBuffer', function() {
    
    it('should work with big endian', function() {
      let bn = BN.fromBuffer(new Buffer('0001', 'hex'), {endian: 'big'});
      bn.toString().should.equal('1');
    });

    it('should work with big endian 256', function() {
      let bn = BN.fromBuffer(new Buffer('0100', 'hex'), {endian: 'big'});
      bn.toString().should.equal('256');
    });

    it('should work with little endian if we specify the size', function() {
      let bn = BN.fromBuffer(new Buffer('0100', 'hex'), {size: 2, endian: 'little'});
      bn.toString().should.equal('1');
    });

  });

  describe('#fromHex', function() {

    it('should create bn from known hex', function() {
      let bn = BN().fromHex('0100', {size: 2, endian: 'little'});
      bn.toString().should.equal('1');
    });
  
  });

  describe('#fromBuffer', function() {

    it('should work as a prototype method', function() {
      let bn = BN().fromBuffer(new Buffer('0100', 'hex'), {size: 2, endian: 'little'});
      bn.toString().should.equal('1');
    });
  
  });

  describe('#toHex', function() {
    
    it('should create a hex string of 4 byte buffer', function() {
      let bn = BN(1);
      bn.toHex({size: 4}).should.equal('00000001');
    });

  });

  describe('#toBuffer', function() {
    
    it('should create a 4 byte buffer', function() {
      let bn = BN(1);
      bn.toBuffer({size: 4}).toString('hex').should.equal('00000001');
    });

    it('should create a 4 byte buffer in little endian', function() {
      let bn = BN(1);
      bn.toBuffer({size: 4, endian: 'little'}).toString('hex').should.equal('01000000');
    });

    it('should create a 2 byte buffer even if you ask for a 1 byte', function() {
      let bn = BN('ff00', 16);
      bn.toBuffer({size: 1}).toString('hex').should.equal('ff00');
    });

    it('should create a 4 byte buffer even if you ask for a 1 byte', function() {
      let bn = BN('ffffff00', 16);
      bn.toBuffer({size: 4}).toString('hex').should.equal('ffffff00');
    });

  });

  describe('#toSM', function() {
    
    it('should convert to SM', function() {
      let buf;
      buf = BN().toSM();
      buf.toString('hex').should.equal('');
      buf = BN(5).toSM();
      buf.toString('hex').should.equal('05');
      buf = BN(-5).toSM();
      buf.toString('hex').should.equal('85');
      buf = BN(128).toSM();
      buf.toString('hex').should.equal('0080');
      buf = BN(-128).toSM();
      buf.toString('hex').should.equal('8080');
      buf = BN(127).toSM();
      buf.toString('hex').should.equal('7f');
      buf = BN(-127).toSM();
      buf.toString('hex').should.equal('ff');
      buf = BN(128).toSM({endian: 'little'});
      buf.toString('hex').should.equal('8000');
      buf = BN(-128).toSM({endian: 'little'});
      buf.toString('hex').should.equal('8080');
    });

  });

  describe('#fromSM', function() {
    
    it('should convert from SM', function() {
      let buf;
      buf = new Buffer([0]);
      BN().fromSM(buf).cmp(0).should.equal(0);
      buf = new Buffer('05', 'hex');
      BN().fromSM(buf).cmp(5).should.equal(0);
      buf = new Buffer('85', 'hex');
      BN().fromSM(buf).cmp(-5).should.equal(0);
      buf = new Buffer('0080', 'hex');
      BN().fromSM(buf).cmp(128).should.equal(0);
      buf = new Buffer('8080', 'hex');
      BN().fromSM(buf).cmp(-128).should.equal(0);
      buf = new Buffer('8000', 'hex');
      BN().fromSM(buf, {endian: 'little'}).cmp(128).should.equal(0);
      buf = new Buffer('8080', 'hex');
      BN().fromSM(buf, {endian: 'little'}).cmp(-128).should.equal(0);
      buf = new Buffer('0080', 'hex'); //negative zero
      BN().fromSM(buf, {endian: 'little'}).cmp(0).should.equal(0);
    });

  });

  describe('#toScriptNumBuffer', function() {

    it('should output a little endian SM number', function() {
      let bn = BN(-23434234);
      bn.toScriptNumBuffer().toString('hex').should.equal(bn.toSM({endian: 'little'}).toString('hex'));
    });

  });

  describe('#fromScriptNumBuffer', function() {
    
    it('should parse this normal number', function() {
      BN().fromScriptNumBuffer(new Buffer('01', 'hex')).toNumber().should.equal(1);
      BN().fromScriptNumBuffer(new Buffer('0080', 'hex')).toNumber().should.equal(0);
      BN().fromScriptNumBuffer(new Buffer('0180', 'hex')).toNumber().should.equal(-1);
    });

    it('should throw an error for a number over 4 bytes', function() {
      (function() {
        BN().fromScriptNumBuffer(new Buffer('8100000000', 'hex')).toNumber().should.equal(-1);
      }).should.throw('script number overflow');
    });

    it('should throw an error for number that is not a minimal size representation', function() {
      //invalid
      (function() {
        BN().fromScriptNumBuffer(new Buffer('80000000', 'hex'), true);
      }).should.throw('non-minimally encoded script number');
      (function() {
        BN().fromScriptNumBuffer(new Buffer('800000', 'hex'), true);
      }).should.throw('non-minimally encoded script number');
      (function() {
        BN().fromScriptNumBuffer(new Buffer('00', 'hex'), true);
      }).should.throw('non-minimally encoded script number');

      //valid
      BN().fromScriptNumBuffer(new Buffer('8000', 'hex'), true).toString().should.equal('128');
      BN().fromScriptNumBuffer(new Buffer('0081', 'hex'), true).toString().should.equal('-256');
      BN().fromScriptNumBuffer(new Buffer('', 'hex'), true).toString().should.equal('0');
      BN().fromScriptNumBuffer(new Buffer('01', 'hex'), true).toString().should.equal('1');

      //invalid, but flag not set
      BN().fromScriptNumBuffer(new Buffer('00000000', 'hex')).toString().should.equal('0');
    });

  });

  describe('#fromNumber', function() {

    it('should convert from a number', function() {
      BN().fromNumber(5).toNumber().should.equal(5);
    });

  });

  describe('#toNumber', function() {

    it('it should convert to a number', function() {
      BN(5).toNumber().should.equal(5);
    });

  });

});
