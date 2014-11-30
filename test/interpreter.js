var should = require('chai').should();
var Interpreter = require('../lib/interpreter');
var Tx = require('../lib/tx');
var Txin = require('../lib/txin');
var Txout = require('../lib/txout');
var Script = require('../lib/script');
var BN = require('../lib/bn');
var Keypair = require('../lib/keypair');
var Privkey = require('../lib/privkey');
var Pubkey = require('../lib/pubkey');
var Signature = require('../lib/signature');

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

  describe('@castToBool', function() {

    it('should cast these bufs to bool correctly', function() {
      Interpreter.castToBool(BN(0).toSM({endian: 'little'})).should.equal(false);
      Interpreter.castToBool(new Buffer('0080', 'hex')).should.equal(false); //negative 0
      Interpreter.castToBool(BN(1).toSM({endian: 'little'})).should.equal(true);
      Interpreter.castToBool(BN(-1).toSM({endian: 'little'})).should.equal(true);

      var buf = new Buffer('00', 'hex');
      var bool = BN().fromSM(buf, {endian: 'little'}).cmp(0) !== 0;
      Interpreter.castToBool(buf).should.equal(bool);
    });

  });

  describe('#verify', function() {

    it('should verify or unverify these trivial scripts from script_valid.json', function() {
      var verified = Interpreter().verify(Script('OP_1'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_1'), Script('OP_0'), Tx(), 0);
      verified.should.equal(false);
      var verified = Interpreter().verify(Script('OP_0'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_CODESEPARATOR'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script(''), Script('OP_DEPTH OP_0 OP_EQUAL'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_1 OP_2'), Script('OP_2 OP_EQUALVERIFY OP_1 OP_EQUAL'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('9 0x000000000000000010'), Script(''), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_1'), Script('OP_15 OP_ADD OP_16 OP_EQUAL'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interpreter().verify(Script('OP_0'), Script('OP_IF OP_VER OP_ELSE OP_1 OP_ENDIF'), Tx(), 0);
      verified.should.equal(true);
    });

    it('should verify this new pay-to-pubkey script', function() {
      var keypair = Keypair().fromRandom();
      var scriptPubkey = Script().writeBuffer(keypair.pubkey.toDER(true)).writeOp('OP_CHECKSIG');
      var hashbuf = new Buffer(32);
      hashbuf.fill(0);
      var gentx = Tx().addTxin(Txin(hashbuf, 0xffffffff, Script('OP_0 OP_0'), 0xffffffff)).addTxout(Txout(BN(0), scriptPubkey));
      var idbuf = gentx.hash();
      var tx = Tx().addTxin(Txin(idbuf, 0, Script(), 0xffffffff)).addTxout(Txout(BN(0), Script()));
      var sig = tx.sign(keypair, Signature.SIGHASH_ALL, 0, scriptPubkey);
      var scriptSig = Script().writeBuffer(sig.toTx());
      var interp = Interpreter();
      var verified = interp.verify(scriptSig, scriptPubkey, tx, 0);
      verified.should.equal(true);
    });

  });

});
