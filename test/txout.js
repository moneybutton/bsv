"use strict";
let should = require('chai').should();
let BN = require('../lib/bn');
let Txout = require('../lib/txout');
let Script = require('../lib/script');
let Varint = require('../lib/varint');
let BR = require('../lib/br');
let BW = require('../lib/bw');

describe('Txout', function() {
  
  let valuebn = BN(5);
  let script = Script().fromString("OP_CHECKMULTISIG");
  let scriptvi = Varint(script.toBuffer().length);
  let txout = new Txout().fromObject({
    valuebn: valuebn,
    scriptvi: scriptvi,
    script: script
  });

  it('should make a new txout', function() {
    let txout = new Txout();
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
      let txout = new Txout().fromObject({
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
      let txout2 = Txout(txout);
      txout2.setScript(Script().fromString('OP_RETURN OP_RETURN OP_RETURN')).scriptvi.toNumber().should.equal(3);
    });

  });

  describe('#fromJSON', function() {
    
    it('should set from this json', function() {
      let txout = Txout().fromJSON({
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
      let txout = Txout().fromJSON({
        valuebn: valuebn.toJSON(),
        scriptvi: scriptvi.toJSON(),
        script: script.toJSON()
      });
      let json = txout.toJSON();
      should.exist(json.valuebn);
      should.exist(json.scriptvi);
      should.exist(json.script);
    });

  });

  describe('#fromHex', function() {
    
    it('should make this txin from this known hex', function() {
      let txout = Txout().fromHex('050000000000000001ae');
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#fromBuffer', function() {
    
    it('should make this txin from this known buffer', function() {
      let txout = Txout().fromBuffer(new Buffer('050000000000000001ae', 'hex'));
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#fromBR', function() {
    
    it('should make this txin from this known buffer', function() {
      let txout = Txout().fromBR(BR(new Buffer('050000000000000001ae', 'hex')));
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#toBuffer', function() {
    
    it('should output this known buffer', function() {
      let txout = Txout().fromBR(BR(new Buffer('050000000000000001ae', 'hex')));
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

  describe('#toBW', function() {
    
    it('should output this known buffer', function() {
      let txout = Txout().fromBR(BR(new Buffer('050000000000000001ae', 'hex')));
      txout.toBW().toBuffer().toString('hex').should.equal('050000000000000001ae');
    });

  });

});
