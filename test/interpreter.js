var should = require('chai').should();
var Interpreter = require('../lib/interpreter');
var Tx = require('../lib/tx');
var Script = require('../lib/script');
var BN = require('../lib/bn');

describe('Interpreter', function() {

  it('should make a new interpreter', function() {
    var interpreter = new Interpreter();
    (interpreter instanceof Interpreter).should.equal(true);
    interpreter.stack.length.should.equal(0);
    interpreter.altstack.length.should.equal(0);
    interpreter.pc.should.equal(0);
    interpreter.pbegincodehash.should.equal(0);
    interpreter.nOpCount.should.equal(0);
    interpreter.vfExec.length.should.equal(0);
    interpreter.errstr.should.equal("");
    interpreter.flags.should.equal(0);
    var interpreter = Interpreter();
    (interpreter instanceof Interpreter).should.equal(true);
    interpreter.stack.length.should.equal(0);
    interpreter.altstack.length.should.equal(0);
    interpreter.pc.should.equal(0);
    interpreter.pbegincodehash.should.equal(0);
    interpreter.nOpCount.should.equal(0);
    interpreter.vfExec.length.should.equal(0);
    interpreter.errstr.should.equal("");
    interpreter.flags.should.equal(0);
  });

  describe('#verify', function() {

    it('should verify or unverify these trivial scripts', function() {
      var verified = Interpreter().verify(Script('OP_1'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_1'), Script('OP_0'), Tx(), 0);
      verified.should.equal(false);
      var verified = Interpreter().verify(Script('OP_0'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_CODESEPARATOR'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
    });

  });

});
