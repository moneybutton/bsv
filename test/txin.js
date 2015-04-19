var should = require('chai').should();
var Script = require('../lib/script');
var Txin = require('../lib/txin');
var Varint = require('../lib/varint');
var BR = require('../lib/br');

describe('Txin', function() {
  
  var txhashbuf = new Buffer(32);
  txhashbuf.fill(0);
  var txoutnum = 0;
  var script = Script().fromString("OP_CHECKMULTISIG");
  var scriptvi = Varint(script.toBuffer().length);
  var seqnum = 0;
  var txin = Txin().set({
    txhashbuf: txhashbuf,
    txoutnum: txoutnum,
    scriptvi: scriptvi,
    script: script,
    seqnum: seqnum
  });

  it('should make a new txin', function() {
    var txin = new Txin();
    should.exist(txin);
    txin = Txin();
    should.exist(txin);
    var txhashbuf = new Buffer(32);
    txhashbuf.fill(0);
    Txin(txhashbuf, 0).txhashbuf.length.should.equal(32);
    (function() {
      var txhashbuf2 = new Buffer(33);
      txhashbuf2.fill(0);
      Txin(txhashbuf2, 0);
    }).should.throw('txhashbuf must be 32 bytes');
  });

  it('should calculate scriptvi correctly when creating a new txin', function() {
    Txin(txin.txhashbuf, txin.txoutnum, txin.script, txin.seqnum).scriptvi.toNumber().should.equal(1);
  });

  describe('#set', function() {
    
    it('should set these vars', function() {
      var txin = Txin().set({
        txhashbuf: txhashbuf,
        txoutnum: txoutnum,
        scriptvi: scriptvi,
        script: script,
        seqnum: seqnum
      });
      should.exist(txin.txhashbuf);
      should.exist(txin.txoutnum);
      should.exist(txin.scriptvi);
      should.exist(txin.script);
      should.exist(txin.seqnum);
    });

  });

  describe('#setScript', function() {
    
    it('should calculate the varint size correctly', function() {
      var txin2 = Txin(txin);
      txin2.setScript(Script('OP_RETURN OP_RETURN OP_RETURN')).scriptvi.toNumber().should.equal(3);
    });

  });

  describe('#fromJSON', function() {
    
    it('should set these vars', function() {
      var txin2 = Txin().fromJSON(txin.toJSON());
      should.exist(txin2.txhashbuf);
      should.exist(txin2.txoutnum);
      should.exist(txin2.scriptvi);
      should.exist(txin2.script);
      should.exist(txin2.seqnum);
    });

  });

  describe('#toJSON', function() {
    
    it('should set these vars', function() {
      var json = txin.toJSON()
      should.exist(json.txhashbuf);
      should.exist(json.txoutnum);
      should.exist(json.scriptvi);
      should.exist(json.script);
      should.exist(json.seqnum);
    });

  });

  describe('#fromHex', function() {
    
    it('should convert this known buffer', function() {
      var hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000';
      var txin = Txin().fromHex(hex);
      txin.scriptvi.toNumber().should.equal(1);
      txin.script.toString().should.equal('OP_CHECKMULTISIG');
    });

  });

  describe('#fromBuffer', function() {
    
    it('should convert this known buffer', function() {
      var hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000';
      var buf = new Buffer(hex, 'hex');
      var txin = Txin().fromBuffer(buf);
      txin.scriptvi.toNumber().should.equal(1);
      txin.script.toString().should.equal('OP_CHECKMULTISIG');
    });

  });

  describe('#fromBR', function() {
    
    it('should convert this known buffer', function() {
      var hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000';
      var buf = new Buffer(hex, 'hex');
      var br = BR(buf);
      var txin = Txin().fromBR(br);
      txin.scriptvi.toNumber().should.equal(1);
      txin.script.toString().should.equal('OP_CHECKMULTISIG');
    });

  });

  describe('#toHex', function() {
    
    it('should convert this known hex', function() {
      txin.toHex().should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000');
    });

  });

  describe('#toBuffer', function() {
    
    it('should convert this known buffer', function() {
      txin.toBuffer().toString('hex').should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000');
    });

  });

  describe('#toBW', function() {
    
    it('should convert this known buffer', function() {
      txin.toBW().concat().toString('hex').should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000');
    });

  });

});
