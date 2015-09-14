'use strict';
let Privkey = require('../lib/privkey');
let base58check = require('../lib/base58check');
let BN = require('../lib/bn');
let Point = require('../lib/point');
let should = require('chai').should();

describe('Privkey', function () {
  let hex = '96c132224121b509b7d0a16245e957d9192609c5637c6228311287b1be21627a';
  let buf = new Buffer(hex, 'hex');
  let enctestnet = 'cSdkPxkAjA4HDr5VHgsebAPDEh9Gyub4HK8UJr2DFGGqKKy4K5sG';
  let enctu = '92jJzK4tbURm1C7udQXxeCBvXHoHJstDXRxAMouPG1k1XUaXdsu';
  let encmainnet = 'L2Gkw3kKJ6N24QcDuH4XDqt9cTqsKTVNDGz1CRZhk9cq4auDUbJy';
  let encmu = '5JxgQaFM1FMd38cd14e3mbdxsdSa9iM2BV6DHBYsvGzxkTNQ7Un';

  it('should satisfy these basic API features', function () {
    let privkey = new Privkey();
    should.exist(privkey);
    privkey = Privkey();
    should.exist(privkey);

    Privkey().constructor.should.equal(Privkey().constructor);
    Privkey.Testnet().constructor.should.equal(Privkey.Testnet().constructor);

    let deps = {};
    Privkey.inject(deps).should.equal(Privkey.inject(deps));
    Privkey.inject(deps).should.not.equal(Privkey.inject({}));
  });

  it('should create a 0 private key with this convenience method', function () {
    let bn = BN(0);
    let privkey = Privkey(bn);
    privkey.bn.toString().should.equal(bn.toString());
  });

  it('should create a mainnet private key', function () {
    let privkey = Privkey(BN.fromBuffer(buf), true);
    privkey.toString().should.equal(encmainnet);
  });

  it('should create an uncompressed testnet private key', function () {
    let privkey = Privkey.Testnet(BN.fromBuffer(buf), false);
    privkey.toString().should.equal(enctu);
  });

  it('should create an uncompressed mainnet private key', function () {
    let privkey = Privkey(BN.fromBuffer(buf), false);
    privkey.toString().should.equal(encmu);
  });

  describe('#fromObject', function () {
    it('should set bn', function () {
      should.exist(Privkey().fromObject({bn: BN.fromBuffer(buf)}).bn);
    });

  });

  describe('#fromJSON', function () {
    it('should input this address correctly', function () {
      let privkey = Privkey();
      privkey.fromJSON(encmu);
      privkey.toWIF().should.equal(encmu);
    });

  });

  describe('#toString', function () {
    it('should output this address correctly', function () {
      let privkey = Privkey();
      privkey.fromJSON(encmu);
      privkey.toJSON().should.equal(encmu);
    });

  });

  describe('#fromRandom', function () {
    it('should set bn gt 0 and lt n, and should be compressed', function () {
      let privkey = Privkey().fromRandom();
      privkey.bn.gt(BN(0)).should.equal(true);
      privkey.bn.lt(Point.getN()).should.equal(true);
      privkey.compressed.should.equal(true);
    });

  });

  describe('#toHex', function () {
    it('should return a hex string', function () {
      let privkey = Privkey().fromBN(BN(5));
      privkey.toHex().should.equal('80000000000000000000000000000000000000000000000000000000000000000501');
    });

  });

  describe('#toBuffer', function () {
    it('should return a buffer', function () {
      let privkey = Privkey().fromBN(BN(5));
      privkey.toBuffer().toString('hex').should.equal('80000000000000000000000000000000000000000000000000000000000000000501');
    });

  });

  describe('#fromHex', function () {
    it('should return a hex string', function () {
      let privkey = Privkey().fromHex('80000000000000000000000000000000000000000000000000000000000000000501');
      privkey.toHex().should.equal('80000000000000000000000000000000000000000000000000000000000000000501');
    });

  });

  describe('#fromBuffer', function () {
    it('should return a buffer', function () {
      let privkey = Privkey().fromBuffer(new Buffer('80000000000000000000000000000000000000000000000000000000000000000501', 'hex'));
      privkey.toBuffer().toString('hex').should.equal('80000000000000000000000000000000000000000000000000000000000000000501');
    });

    it('should throw an error if buffer is wrong length', function () {
      (function () {
        let privkey = Privkey().fromBuffer(new Buffer('8000000000000000000000000000000000000000000000000000000000000000050100', 'hex'));
      }).should.throw('Length of privkey buffer must be 33 (uncompressed pubkey) or 34 (compressed pubkey)');(function () {
        let privkey = Privkey().fromBuffer(new Buffer('8000000000000000000000000000000000000000000000000000000000000005', 'hex'));
      }).should.throw('Length of privkey buffer must be 33 (uncompressed pubkey) or 34 (compressed pubkey)');
    });

    it('should throw an error if buffer has wrong version byte', function () {
      (function () {
        let privkey = Privkey().fromBuffer(new Buffer('90000000000000000000000000000000000000000000000000000000000000000501', 'hex'));
      }).should.throw('Invalid version byte');
    });

  });

  describe('#toBN', function () {
    it('should return a bn', function () {
      let privkey = Privkey().fromBN(BN(5));
      privkey.toBN().eq(BN(5)).should.equal(true);
    });

  });

  describe('#fromBN', function () {
    it('should create a privkey from a bignum', function () {
      let privkey = Privkey().fromBN(BN(5));
      privkey.bn.toString().should.equal('5');
    });

  });

  describe('#validate', function () {
    it('should unvalidate these privkeys', function () {
      let privkey = Privkey();
      privkey.compressed = true;
      privkey.bn = Point.getN();(function () {
        privkey.validate();
      }).should.throw('Number must be less than N');
      privkey.bn = Point.getN().sub(1);
      privkey.compressed = undefined;(function () {
        privkey.validate();
      }).should.throw('Must specify whether the corresponding public key is compressed or not (true or false)');
      privkey.compressed = true;
      privkey.validate().should.equal(privkey);
    });

  });

  describe('#fromWIF', function () {
    it('should parse this compressed testnet address correctly', function () {
      let privkey = Privkey();
      privkey.fromWIF(encmainnet);
      privkey.toWIF().should.equal(encmainnet);
    });

  });

  describe('#toWIF', function () {
    it('should parse this compressed testnet address correctly', function () {
      let privkey = Privkey.Testnet();
      privkey.fromWIF(enctestnet);
      privkey.toWIF().should.equal(enctestnet);
    });

  });

  describe('#fromString', function () {
    it('should parse this uncompressed testnet address correctly', function () {
      let privkey = Privkey.Testnet();
      privkey.fromString(enctu);
      privkey.toWIF().should.equal(enctu);
    });

  });

  describe('#toString', function () {
    it('should parse this uncompressed mainnet address correctly', function () {
      let privkey = Privkey();
      privkey.fromString(encmu);
      privkey.toString().should.equal(encmu);
    });

  });

});
