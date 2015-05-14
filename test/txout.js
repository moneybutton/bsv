"use strict";
var should = require('chai').should();
var BN = require('../lib/bn');
var Txout = require('../lib/txout');
var Script = require('../lib/script');
var Varint = require('../lib/varint');
var BR = require('../lib/br');
var BW = require('../lib/bw');

describe('Txout', function() {
  
  var valuebn = BN(5);
  var script = Script().fromString("OP_CHECKMULTISIG");
  var scriptvi = Varint(script.toBuffer().length);
  var txout = new Txout().set({
    valuebn: valuebn,
    scriptvi: scriptvi,
    script: script
  });

  it('should make a new txout', function() {
    var txout = new Txout();
    should.exist(txout);
    txout = Txout();
    should.exist(txout);
    Txout(valuebn, scriptvi, script).valuebn.toString().should.equal('5');
  });

  it('should calculate scriptvi correctly when making a new txout', function() {
    Txout(valuebn, script).scriptvi.toNumber().should.equal(1);
  });

  describe('#set', function() {
    
    it('should set this object', function() {
      var txout = new Txout().set({
        valuebn: valuebn,
        scriptvi: scriptvi,
        script: script
      });
      should.exist(txout.valuebn);
      should.exist(txout.scriptvi);
      should.exist(txout.script);
    });

  });

  describe('#setScript', function() {
    
    it('should set the script size correctly', function() {
      var txout2 = Txout(txout);
      txout2.setScript(Script('OP_RETURN OP_RETURN OP_RETURN')).scriptvi.toNumber().should.equal(3);
    });

  });

  describe('#fromJSON', function() {
    
    it('should set from this json', function() {
      var txout = Txout().fromJSON({
        valuebn: valuebn.toJSON(),
        scriptvi: scriptvi.toJSON(),
        script: script.toJSON()
      });
      should.exist(txout.valuebn);
      should.exist(txout.scriptvi);
      should.exist(txout.script);
    });

  });

  describe('#toJSON', function() {
    
    it('should return this json', function() {
      var txout = Txout().fromJSON({
        valuebn: valuebn.toJSON(),
        scriptvi: scriptvi.toJSON(),
        script: script.toJSON()
      });
      var json = txout.toJSON();
      should.exist(json.valuebn);
      should.exist(json.scriptvi);
      should.exist(json.script);
    });

  });

  describe('#fromHex', function() {
    
    it('should make this txin from this known hex', function() {
      var txout = Txout().fromHex('050000000000000001ae');
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#fromBuffer', function() {
    
    it('should make this txin from this known buffer', function() {
      var txout = Txout().fromBuffer(new Buffer('050000000000000001ae', 'hex'));
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#fromBR', function() {
    
    it('should make this txin from this known buffer', function() {
      var txout = Txout().fromBR(BR(new Buffer('050000000000000001ae', 'hex')));
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#toBuffer', function() {
    
    it('should output this known buffer', function() {
      var txout = Txout().fromBR(BR(new Buffer('050000000000000001ae', 'hex')));
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#toBW', function() {
    
    it('should output this known buffer', function() {
      var txout = Txout().fromBR(BR(new Buffer('050000000000000001ae', 'hex')));
      txout.toBW().concat().toString('hex').should.equal('050000000000000001ae');
    });

  });

});
