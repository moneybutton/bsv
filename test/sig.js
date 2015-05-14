"use strict";
var BN = require('../lib/bn');
var should = require('chai').should();
var Sig = require('../lib/sig');

describe('Sig', function() {

  it('should make a blank signature', function() {
    var sig = new Sig();
    should.exist(sig);
  });

  it('should work with conveniently setting r, s', function() {
    var r = BN();
    var s = BN();
    var sig = new Sig(r, s);
    should.exist(sig);
    sig.r.toString().should.equal(r.toString());
    sig.s.toString().should.equal(s.toString());
  });

  describe('#set', function() {
    
    it('should set compressed', function() {
      should.exist(Sig().set({compressed: true}));
    });

  });

  describe('#fromHex', function() {

    it('should parse this known signature and rebuild it', function() {
      var hex = "3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501";
      var sig = Sig().fromHex(hex);
      sig.toHex().should.equal(hex);
    });

    it('should create a signature from a compressed signature', function() {
      var blank = new Buffer(32);
      blank.fill(0);
      var compressed = Buffer.concat([
        new Buffer([0 + 27 + 4]),
        blank,
        blank
        ]);
      var sig = new Sig();
      sig.fromHex(compressed.toString('hex'));
      sig.r.cmp(0).should.equal(0);
      sig.s.cmp(0).should.equal(0);
    });

    it('should parse this DER format signature', function() {
      var buf = new Buffer('3044022075fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e62770220729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2', 'hex');
      var sig = new Sig();
      sig.fromHex(buf.toString('hex'));
      sig.r.toBuffer({size: 32}).toString('hex').should.equal('75fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e6277');
      sig.s.toBuffer({size: 32}).toString('hex').should.equal('729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2');
    });

    it('should parse this known signature and rebuild it', function() {
      var hex = "3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501";
      var sig = Sig().fromHex(hex);
      sig.toTxFormat().toString('hex').should.equal(hex);
    });

  });

  describe('#fromBuffer', function() {
    
    it('should create a signature from a compressed signature', function() {
      var blank = new Buffer(32);
      blank.fill(0);
      var compressed = Buffer.concat([
        new Buffer([0 + 27 + 4]),
        blank,
        blank
        ]);
      var sig = new Sig();
      sig.fromBuffer(compressed);
      sig.r.cmp(0).should.equal(0);
      sig.s.cmp(0).should.equal(0);
    });

    it('should parse this DER format signature', function() {
      var buf = new Buffer('3044022075fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e62770220729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2', 'hex');
      var sig = new Sig();
      sig.fromBuffer(buf);
      sig.r.toBuffer({size: 32}).toString('hex').should.equal('75fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e6277');
      sig.s.toBuffer({size: 32}).toString('hex').should.equal('729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2');
    });

    it('should parse this known signature and rebuild it', function() {
      var hex = "3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501";
      var buf = new Buffer(hex, 'hex');
      var sig = Sig().fromBuffer(buf);
      sig.toTxFormat().toString('hex').should.equal(hex);
    });

  });

  describe('#fromCompact', function() {
    
    it('should create a signature from a compressed signature', function() {
      var blank = new Buffer(32);
      blank.fill(0);
      var compressed = Buffer.concat([
        new Buffer([0 + 27 + 4]),
        blank,
        blank
        ]);
      var sig = new Sig();
      sig.fromCompact(compressed);
      sig.r.cmp(0).should.equal(0);
      sig.s.cmp(0).should.equal(0);
    });

  });

  describe('#fromDER', function() {
    
    var buf = new Buffer('3044022075fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e62770220729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2', 'hex');

    it('should parse this DER format signature', function() {
      var sig = new Sig();
      sig.fromDER(buf);
      sig.r.toBuffer({size: 32}).toString('hex').should.equal('75fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e6277');
      sig.s.toBuffer({size: 32}).toString('hex').should.equal('729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2');
    });

  });

  describe('#fromTxFormat', function() {

    it('should convert from this known tx-format buffer', function() {
      var buf = new Buffer('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e7201', 'hex');
      var sig = Sig().fromTxFormat(buf);
      sig.r.toString().should.equal('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      sig.s.toString().should.equal('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      sig.nhashtype.should.equal(Sig.SIGHASH_ALL);
    });

    it('should parse this known signature and rebuild it', function() {
      var hex = "3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501";
      var buf = new Buffer(hex, 'hex');
      var sig = Sig().fromTxFormat(buf);
      sig.toTxFormat().toString('hex').should.equal(hex);
    });

  });

  describe('#fromString', function() {
    
    var buf = new Buffer('3044022075fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e62770220729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2', 'hex');

    it('should parse this DER format signature in hex', function() {
      var sig = new Sig();
      sig.fromString(buf.toString('hex'));
      sig.r.toBuffer({size: 32}).toString('hex').should.equal('75fc517e541bd54769c080b64397e32161c850f6c1b2b67a5c433affbb3e6277');
      sig.s.toBuffer({size: 32}).toString('hex').should.equal('729e85cc46ffab881065ec07694220e71d4df9b2b8c8fd12c3122cf3a5efbcf2');
    });

  });

  describe('#parseDER', function() {

    it('should parse this signature generated in node', function() {
      var sighex = '30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72';
      var sig = new Buffer(sighex, 'hex');
      var parsed = Sig.parseDER(sig);
      parsed.header.should.equal(0x30)
      parsed.length.should.equal(69)
      parsed.rlength.should.equal(33);
      parsed.rneg.should.equal(true);
      parsed.rbuf.toString('hex').should.equal('008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa');
      parsed.r.toString().should.equal('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      parsed.slength.should.equal(32);
      parsed.sneg.should.equal(false);
      parsed.sbuf.toString('hex').should.equal('0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      parsed.s.toString().should.equal('4331694221846364448463828256391194279133231453999942381442030409253074198130');
    });

    it('should parse this 69 byte signature', function() {
      var sighex = '3043021f59e4705959cc78acbfcf8bd0114e9cc1b389a4287fb33152b73a38c319b50302202f7428a27284c757e409bf41506183e9e49dfb54d5063796dfa0d403a4deccfa';
      var sig = new Buffer(sighex, 'hex');
      var parsed = Sig.parseDER(sig);
      parsed.header.should.equal(0x30)
      parsed.length.should.equal(67)
      parsed.rlength.should.equal(31);
      parsed.rneg.should.equal(false);
      parsed.rbuf.toString('hex').should.equal('59e4705959cc78acbfcf8bd0114e9cc1b389a4287fb33152b73a38c319b503');
      parsed.r.toString().should.equal('158826015856106182499128681792325160381907915189052224498209222621383996675');
      parsed.slength.should.equal(32);
      parsed.sneg.should.equal(false);
      parsed.sbuf.toString('hex').should.equal('2f7428a27284c757e409bf41506183e9e49dfb54d5063796dfa0d403a4deccfa');
      parsed.s.toString().should.equal('21463938592353267769710297084836796652964571266930856168996063301532842380538');
    });

    it('should parse this 68 byte signature', function() {
      var sighex = '3042021e17cfe77536c3fb0526bd1a72d7a8e0973f463add210be14063c8a9c37632022061bfa677f825ded82ba0863fb0c46ca1388dd3e647f6a93c038168b59d131a51';
      var sig = new Buffer(sighex, 'hex');
      var parsed = Sig.parseDER(sig);
      parsed.header.should.equal(0x30)
      parsed.length.should.equal(66)
      parsed.rlength.should.equal(30);
      parsed.rneg.should.equal(false);
      parsed.rbuf.toString('hex').should.equal('17cfe77536c3fb0526bd1a72d7a8e0973f463add210be14063c8a9c37632');
      parsed.r.toString().should.equal('164345250294671732127776123343329699648286106708464198588053542748255794');
      parsed.slength.should.equal(32);
      parsed.sneg.should.equal(false);
      parsed.sbuf.toString('hex').should.equal('61bfa677f825ded82ba0863fb0c46ca1388dd3e647f6a93c038168b59d131a51');
      parsed.s.toString().should.equal('44212963026209759051804639008236126356702363229859210154760104982946304432721');
    });

  });

  describe('@isTxDER', function() {

    it('should know this is a DER signature', function() {
      var sighex = '3042021e17cfe77536c3fb0526bd1a72d7a8e0973f463add210be14063c8a9c37632022061bfa677f825ded82ba0863fb0c46ca1388dd3e647f6a93c038168b59d131a5101';
      var sigbuf = new Buffer(sighex, 'hex');
      Sig.isTxDER(sigbuf).should.equal(true);
    });

    it('should know this is not a DER signature', function() {
      //for more extensive tests, see the script interpreter
      var sighex = '3042021e17cfe77536c3fb0526bd1a72d7a8e0973f463add210be14063c8a9c37632022061bfa677f825ded82ba0863fb0c46ca1388dd3e647f6a93c038168b59d131a5101';
      var sigbuf = new Buffer(sighex, 'hex');
      sigbuf[0] = 0x31;
      Sig.isTxDER(sigbuf).should.equal(false);
    });

  });

  describe('#toHex', function() {

    it('should convert these known r and s values into a known signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s});
      sig.toHex().should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

    it('should convert these known r, s, nhashtype values into a known signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var nhashtype = Sig.SIGHASH_ALL;
      var sig = new Sig(r, s, nhashtype);
      sig.toHex().should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e7201');
    });

    it('should convert these known r and s values and guessed i values into signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s, i: 0});
      sig.toHex().toString('hex').should.equal('1f8bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 1});
      sig.toHex().toString('hex').should.equal('208bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 2});
      sig.toHex().toString('hex').should.equal('218bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 3});
      sig.toHex().toString('hex').should.equal('228bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

  });

  describe('#toBuffer', function() {

    it('should convert these known r and s values into a known signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s});
      var der = sig.toBuffer();
      der.toString('hex').should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

    it('should convert these known r, s, nhashtype values into a known signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var nhashtype = Sig.SIGHASH_ALL;
      var sig = new Sig(r, s, nhashtype);
      var buf = sig.toBuffer();
      buf.toString('hex').should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e7201');
    });

    it('should convert these known r and s values and guessed i values into signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s, i: 0});
      sig.toBuffer().toString('hex').should.equal('1f8bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 1});
      sig.toBuffer().toString('hex').should.equal('208bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 2});
      sig.toBuffer().toString('hex').should.equal('218bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 3});
      sig.toBuffer().toString('hex').should.equal('228bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

  });

  describe('#toCompact', function() {

    it('should convert these known r and s values and guessed i values into signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s, i: 0});
      sig.toCompact().toString('hex').should.equal('1f8bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 1});
      sig.toCompact().toString('hex').should.equal('208bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 2});
      sig.toCompact().toString('hex').should.equal('218bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
      var sig = new Sig({r: r, s: s, i: 3});
      sig.toCompact().toString('hex').should.equal('228bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa0993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

  });

  describe('#toDER', function() {

    it('should convert these known r and s values into a known signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s});
      var der = sig.toDER();
      der.toString('hex').should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

  });

  describe('#toTxFormat', function() {
    
    it('should convert these known r, s, nhashtype values into a known signature', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var nhashtype = Sig.SIGHASH_ALL;
      var sig = new Sig(r, s, nhashtype);
      var buf = sig.toTxFormat();
      buf.toString('hex').should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e7201');
    });

  });

  describe('#toString', function() {

    it('should convert this signature in to hex DER', function() {
      var r = BN('63173831029936981022572627018246571655303050627048489594159321588908385378810');
      var s = BN('4331694221846364448463828256391194279133231453999942381442030409253074198130');
      var sig = new Sig({r: r, s: s});
      var hex = sig.toString();
      hex.should.equal('30450221008bab1f0a2ff2f9cb8992173d8ad73c229d31ea8e10b0f4d4ae1a0d8ed76021fa02200993a6ec81755b9111762fc2cf8e3ede73047515622792110867d12654275e72');
    });

  });

});
