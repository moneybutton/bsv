var Script = require('./script');
var Opcode = require('./opcode');
var Tx = require('./tx');
var BN = require('./bn');
var Hash = require('./hash');
var BufferReader = require('./bufferreader');
var BufferWriter = require('./bufferwriter');
var Signature = require('./signature');
var Pubkey = require('./pubkey');

// Script interpreter. The primary way to use it is via the verify function.
// e.g., Interp().verify( ... );
var Interp = function Interp(script, tx, nin) {
  if (!(this instanceof Interp))
    return new Interp(script, tx, nin);
  if (script && tx && (typeof nin === 'number')) {
    this.initialize();
    this.set({
      script: script,
      tx: tx,
      nin: nin
    });
  } else if (script) {
    var obj = script;
    this.initialize();
    this.set(obj);
  } else {
    this.initialize();
  }
};

module.exports = Interp;

Interp.prototype.initialize = function(obj) {
  this.stack = [];
  this.altstack = [];
  this.pc = 0;
  this.pbegincodehash = 0;
  this.nOpCount = 0;
  this.vfExec = [];
  this.errstr = "";
  this.flags = 0;
};

Interp.prototype.set = function(obj) {
  this.script = obj.script || this.script;
  this.tx = obj.tx || this.tx;
  this.nin = typeof obj.nin !== 'undefined' ? obj.nin : this.nin;
  this.stack = obj.stack || this.stack;
  this.altstack = obj.altack || this.altstack;
  this.pc = typeof obj.pc !== 'undefined' ? obj.pc : this.pc;
  this.pbegincodehash = typeof obj.pbegincodehash !== 'undefined' ? obj.pbegincodehash : this.pbegincodehash;
  this.nOpCount = typeof obj.nOpCount !== 'undefined' ? obj.nOpCount : this.nOpCount;
  this.vfExec = obj.vfExec || this.vfExec;
  this.errstr = obj.errstr || this.errstr;
  this.flags = typeof obj.flags !== 'undefined' ? obj.flags : this.flags;
};

Interp.true = new Buffer([1]);
Interp.false = new Buffer([]);

Script.MAX_SCRIPT_ELEMENT_SIZE = 520;

// flags taken from bitcoind
// bitcoind commit: b5d1b1092998bc95313856d535c632ea5a8f9104
Interp.SCRIPT_VERIFY_NONE = 0;

// Evaluate P2SH subscripts (softfork safe, BIP16).
Interp.SCRIPT_VERIFY_P2SH = (1 << 0);

// Passing a non-strict-DER signature or one with undefined hashtype to a checksig operation causes script failure.
// Passing a pubkey that is not (0x04 + 64 bytes) or (0x02 or 0x03 + 32 bytes) to checksig causes that pubkey to be
// skipped (not softfork safe: this flag can widen the validity of OP_CHECKSIG OP_NOT).
Interp.SCRIPT_VERIFY_STRICTENC = (1 << 1);

// Passing a non-strict-DER signature to a checksig operation causes script failure (softfork safe, BIP62 rule 1)
Interp.SCRIPT_VERIFY_DERSIG = (1 << 2);

// Passing a non-strict-DER signature or one with S > order/2 to a checksig operation causes script failure
// (softfork safe, BIP62 rule 5).
Interp.SCRIPT_VERIFY_LOW_S = (1 << 3);

// verify dummy stack item consumed by CHECKMULTISIG is of zero-length (softfork safe, BIP62 rule 7).
Interp.SCRIPT_VERIFY_NULLDUMMY = (1 << 4);

// Using a non-push operator in the scriptSig causes script failure (softfork safe, BIP62 rule 2).
Interp.SCRIPT_VERIFY_SIGPUSHONLY = (1 << 5);

// Require minimal encodings for all push operations (OP_0... OP_16, OP_1NEGATE where possible, direct
// pushes up to 75 bytes, OP_PUSHDATA up to 255 bytes, OP_PUSHDATA2 for anything larger). Evaluating
// any other push causes the script to fail (BIP62 rule 3).
// In addition, whenever a stack element is interpreted as a number, it must be of minimal length (BIP62 rule 4).
// (softfork safe)
Interp.SCRIPT_VERIFY_MINIMALDATA = (1 << 6);

Interp.castToBool = function(buf) {
  for (var i = 0; i < buf.length; i++) {
    if (buf[i] != 0) {
      // can be negative zero
      if (i === buf.length - 1 && buf[i] == 0x80)
        return false;
      return true;
    }
  }
  return false;
};

// eval code translated from bitcoind
// bitcoind commit: b5d1b1092998bc95313856d535c632ea5a8f9104
Interp.prototype.eval = function() {
  if (this.script.toBuffer().length > 10000) {
    this.errstr = "SCRIPT_ERR_SCRIPT_SIZE";
    return false;
  }

  try {
    while (this.pc < this.script.chunks.length) {
      var fSuccess = this.step();
      if (!fSuccess)
        return false;
    }

    // Size limits
    if (this.stack.length + this.altstack.length > 1000) {
      this.errstr = "SCRIPT_ERR_STACK_SIZE";
      return false;
    }
  } catch (e) {
    this.errstr = "SCRIPT_ERR_UNKNOWN_ERROR: " + e;
    return false;
  }

  if (this.vfExec.length > 0) {
    this.errstr = "SCRIPT_ERR_UNBALANCED_CONDITIONAL";
    return false;
  }

  return true;
}

// step code translated from bitcoind
// (extracted from the eval function)
// bitcoind commit: b5d1b1092998bc95313856d535c632ea5a8f9104
Interp.prototype.step = function() {

  var fRequireMinimal = (this.flags & Interp.SCRIPT_VERIFY_MINIMALDATA) != 0;

  //bool fExec = !count(vfExec.begin(), vfExec.end(), false);
  var fExec = !(this.vfExec.indexOf(false) + 1);

  //
  // Read instruction
  //
  var chunk = this.script.chunks[this.pc];
  this.pc++;
  var opcodenum = chunk.opcodenum;
  if (typeof opcodenum === 'undefined') {
    this.errstr = "SCRIPT_ERR_BAD_OPCODE";
    return false;
  }
  if (chunk.buf && chunk.buf.length > Interp.MAX_SCRIPT_ELEMENT_SIZE) {
    this.errstr = "SCRIPT_ERR_PUSH_SIZE";
    return false;
  }

  // Note how Opcode.map.OP_RESERVED does not count towards the opcode limit.
  if (opcodenum > Opcode.map.OP_16 && ++(this.nOpCount) > 201) {
    this.errstr = "SCRIPT_ERR_OP_COUNT";
    return false;
  }

  if (opcodenum === Opcode.map.OP_CAT ||
    opcodenum === Opcode.map.OP_SUBSTR ||
    opcodenum === Opcode.map.OP_LEFT ||
    opcodenum === Opcode.map.OP_RIGHT ||
    opcodenum === Opcode.map.OP_INVERT ||
    opcodenum === Opcode.map.OP_AND ||
    opcodenum === Opcode.map.OP_OR ||
    opcodenum === Opcode.map.OP_XOR ||
    opcodenum === Opcode.map.OP_2MUL ||
    opcodenum === Opcode.map.OP_2DIV ||
    opcodenum === Opcode.map.OP_MUL ||
    opcodenum === Opcode.map.OP_DIV ||
    opcodenum === Opcode.map.OP_MOD ||
    opcodenum === Opcode.map.OP_LSHIFT ||
    opcodenum === Opcode.map.OP_RSHIFT) {
    this.errstr = "SCRIPT_ERR_DISABLED_OPCODE";
    return false;
  }

  if (fExec && 0 <= opcodenum && opcodenum <= Opcode.map.OP_PUSHDATA4) {
    if (fRequireMinimal && !this.script.checkMinimalPush(this.pc - 1)) {
      this.errstr = "SCRIPT_ERR_MINIMALDATA";
      return false;
    }
    if (!chunk.buf)
      this.stack.push(Interp.false);
    else
      this.stack.push(chunk.buf); // TODO: what if chunk.len !== chunk.buf.length ?
  } else if (fExec || (Opcode.map.OP_IF <= opcodenum && opcodenum <= Opcode.map.OP_ENDIF))
  switch (opcodenum)
  {
    //
    // Push value
    //
    case Opcode.map.OP_1NEGATE:
    case Opcode.map.OP_1:
    case Opcode.map.OP_2:
    case Opcode.map.OP_3:
    case Opcode.map.OP_4:
    case Opcode.map.OP_5:
    case Opcode.map.OP_6:
    case Opcode.map.OP_7:
    case Opcode.map.OP_8:
    case Opcode.map.OP_9:
    case Opcode.map.OP_10:
    case Opcode.map.OP_11:
    case Opcode.map.OP_12:
    case Opcode.map.OP_13:
    case Opcode.map.OP_14:
    case Opcode.map.OP_15:
    case Opcode.map.OP_16:
    {
      // ( -- value)
      // CScriptNum bn((int)opcode - (int)(Opcode.map.OP_1 - 1));
      var n = opcodenum - (Opcode.map.OP_1 - 1);
      var buf = BN(n).toCScriptNumBuffer();
      this.stack.push(buf);
      // The result of these opcodes should always be the minimal way to push the data
      // they push, so no need for a CheckMinimalPush here.
    }
    break;


    //
    // Control
    //
    case Opcode.map.OP_NOP:
    case Opcode.map.OP_NOP1: case Opcode.map.OP_NOP2: case Opcode.map.OP_NOP3: case Opcode.map.OP_NOP4: case Opcode.map.OP_NOP5:
    case Opcode.map.OP_NOP6: case Opcode.map.OP_NOP7: case Opcode.map.OP_NOP8: case Opcode.map.OP_NOP9: case Opcode.map.OP_NOP10:
    break;

    case Opcode.map.OP_IF:
    case Opcode.map.OP_NOTIF:
    {
      // <expression> if [statements] [else [statements]] endif
      // bool fValue = false;
      var fValue = false;
      if (fExec)
      {
        if (this.stack.length < 1) {
          this.errstr = "SCRIPT_ERR_UNBALANCED_CONDITIONAL";
          return false;
        }
        var vch = this.stack.pop();
        fValue = Interp.castToBool(vch);
        if (opcodenum === Opcode.map.OP_NOTIF)
          fValue = !fValue;
      }
      this.vfExec.push(fValue);
    }
    break;

    case Opcode.map.OP_ELSE:
    {
      if (this.vfExec.length === 0) {
        this.errstr = "SCRIPT_ERR_UNBALANCED_CONDITIONAL";
        return false;
      }
      this.vfExec[this.vfExec.length - 1] = !this.vfExec[this.vfExec.length - 1];
    }
    break;

    case Opcode.map.OP_ENDIF:
    {
      if (this.vfExec.length === 0) {
        this.errstr = "SCRIPT_ERR_UNBALANCED_CONDITIONAL";
        return false;
      }
      this.vfExec.pop();
    }
    break;

    case Opcode.map.OP_VERIFY:
    {
      // (true -- ) or
      // (false -- false) and return
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch = this.stack[this.stack.length - 1];
      var fValue = Interp.castToBool(vch);
      if (fValue)
        this.stack.pop();
      else {
        this.errstr = "SCRIPT_ERR_VERIFY";
        return false;
      }
    }
    break;

    case Opcode.map.OP_RETURN:
    {
      this.errstr = "SCRIPT_ERR_OP_RETURN";
      return false;
    }
    break;


    //
    // Stack ops
    //
    case Opcode.map.OP_TOALTSTACK:
    {
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.altstack.push(this.stack.pop());
    }
    break;

    case Opcode.map.OP_FROMALTSTACK:
    {
      if (this.altstack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_ALTSTACK_OPERATION";
        return false;
      }
      this.stack.push(this.altstack.pop());
    }
    break;

    case Opcode.map.OP_2DROP:
    {
      // (x1 x2 -- )
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.stack.pop();
      this.stack.pop();
    }
    break;

    case Opcode.map.OP_2DUP:
    {
      // (x1 x2 -- x1 x2 x1 x2)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch1 = this.stack[this.stack.length - 2];
      var vch2 = this.stack[this.stack.length - 1];
      this.stack.push(vch1);
      this.stack.push(vch2);
    }
    break;

    case Opcode.map.OP_3DUP:
    {
      // (x1 x2 x3 -- x1 x2 x3 x1 x2 x3)
      if (this.stack.length < 3) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch1 = this.stack[this.stack.length - 3];
      var vch2 = this.stack[this.stack.length - 2];
      var vch3 = this.stack[this.stack.length - 1];
      this.stack.push(vch1);
      this.stack.push(vch2);
      this.stack.push(vch3);
    }
    break;

    case Opcode.map.OP_2OVER:
    {
      // (x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2)
      if (this.stack.length < 4) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch1 = this.stack[this.stack.length - 4];
      var vch2 = this.stack[this.stack.length - 3];
      this.stack.push(vch1);
      this.stack.push(vch2);
    }
    break;

    case Opcode.map.OP_2ROT:
    {
      // (x1 x2 x3 x4 x5 x6 -- x3 x4 x5 x6 x1 x2)
      if (this.stack.length < 6) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var spliced = this.stack.splice(this.stack.length - 6, 2);
      this.stack.push(spliced[0]);
      this.stack.push(spliced[1]);
    }
    break;

    case Opcode.map.OP_2SWAP:
    {
      // (x1 x2 x3 x4 -- x3 x4 x1 x2)
      if (this.stack.length < 4) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var spliced = this.stack.splice(this.stack.length - 4, 2);
      this.stack.push(spliced[0]);
      this.stack.push(spliced[1]);
    }
    break;

    case Opcode.map.OP_IFDUP:
    {
      // (x - 0 | x x)
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch = this.stack[this.stack.length - 1];
      var fValue = Interp.castToBool(vch);
      if (fValue)
        this.stack.push(vch);
    }
    break;

    case Opcode.map.OP_DEPTH:
    {
      // -- stacksize
      var vch = BN(this.stack.length).toCScriptNumBuffer();
      this.stack.push(vch);
    }
    break;

    case Opcode.map.OP_DROP:
    {
      // (x -- )
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.stack.pop();
    }
    break;

    case Opcode.map.OP_DUP:
    {
      // (x -- x x)
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.stack.push(this.stack[this.stack.length - 1]);
    }
    break;

    case Opcode.map.OP_NIP:
    {
      // (x1 x2 -- x2)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.stack.splice(this.stack.length - 2, 1);
    }
    break;

    case Opcode.map.OP_OVER:
    {
      // (x1 x2 -- x1 x2 x1)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.stack.push(this.stack[this.stack.length - 2]);
    }
    break;

    case Opcode.map.OP_PICK:
    case Opcode.map.OP_ROLL:
    {
      // (xn ... x2 x1 x0 n - xn ... x2 x1 x0 xn)
      // (xn ... x2 x1 x0 n - ... x2 x1 x0 xn)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      // int n = CScriptNum(stacktop(-1), fRequireMinimal).getint(); //TODO: support flags here
      var buf = this.stack[this.stack.length - 1];
      var bn = BN().fromCScriptNumBuffer(buf);
      this.stack.pop();
      if (bn.lt(0) || bn.gt(this.stack.length)) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch = this.stack[this.stack.length - n - 1];
      if (opcodenum === Opcode.map.OP_ROLL)
        this.stack.splice(this.stack.length - n - 1, 1);
      this.stack.push(vch);
    }
    break;

    case Opcode.map.OP_ROT:
    {
      // (x1 x2 x3 -- x2 x3 x1)
      //  x2 x1 x3  after first swap
      //  x2 x3 x1  after second swap
      if (this.stack.length < 3) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var x1 = this.stack[this.stack.length - 3];
      var x2 = this.stack[this.stack.length - 2];
      var x3 = this.stack[this.stack.length - 1];
      this.stack[this.stack.length - 3] = x2;
      this.stack[this.stack.length - 2] = x3;
      this.stack[this.stack.length - 1] = x1;
    }
    break;

    case Opcode.map.OP_SWAP:
    {
      // (x1 x2 -- x2 x1)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var x1 = this.stack[this.stack.length - 2];
      var x2 = this.stack[this.stack.length - 1];
      this.stack[this.stack.length - 2] = x2;
      this.stack[this.stack.length - 1] = x1;
    }
    break;

    case Opcode.map.OP_TUCK:
    {
      // (x1 x2 -- x2 x1 x2)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      this.stack.splice(this.stack.length - 2, 0, this.stack[this.stack.length - 1]);
    }
    break;


    case Opcode.map.OP_SIZE:
    {
      // (in -- in size)
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var bn = BN(this.stack[this.stack.length - 1].length);
      this.stack.push(bn.toCScriptNumBuffer());
    }
    break;


    //
    // Bitwise logic
    //
    case Opcode.map.OP_EQUAL:
    case Opcode.map.OP_EQUALVERIFY:
    //case Opcode.map.OP_NOTEQUAL: // use Opcode.map.OP_NUMNOTEQUAL
    {
      // (x1 x2 - bool)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch1 = this.stack[this.stack.length - 2];
      var vch2 = this.stack[this.stack.length - 1];
      var fEqual = vch1.toString('hex') === vch2.toString('hex');
      // Opcode.map.OP_NOTEQUAL is disabled because it would be too easy to say
      // something like n != 1 and have some wiseguy pass in 1 with extra
      // zero bytes after it (numerically, 0x01 == 0x0001 == 0x000001)
      //if (opcode == Opcode.map.OP_NOTEQUAL)
      //  fEqual = !fEqual;
      this.stack.pop();
      this.stack.pop();
      this.stack.push(fEqual ? Interp.true : Interp.false);
      if (opcodenum === Opcode.map.OP_EQUALVERIFY)
      {
        if (fEqual)
          this.stack.pop();
        else {
          this.errstr = "SCRIPT_ERR_EQUALVERIFY";
          return false;
        }
      }
    }
    break;


    //
    // Numeric
    //
    case Opcode.map.OP_1ADD:
    case Opcode.map.OP_1SUB:
    case Opcode.map.OP_NEGATE:
    case Opcode.map.OP_ABS:
    case Opcode.map.OP_NOT:
    case Opcode.map.OP_0NOTEQUAL:
    {
      // (in -- out)
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      // CScriptNum bn(stacktop(-1), fRequireMinimal); //TODO: enable flags here
      var buf = this.stack[this.stack.length - 1];
      var bn = BN().fromCScriptNumBuffer(buf);
      switch (opcodenum)
      {
      case Opcode.map.OP_1ADD:     bn = bn.add(1); break;
      case Opcode.map.OP_1SUB:     bn = bn.sub(1); break;
      case Opcode.map.OP_NEGATE:   bn = bn.neg(); break;
      case Opcode.map.OP_ABS:    if (bn.cmp(0) < 0) bn = bn.neg(); break;
      case Opcode.map.OP_NOT:    bn = BN((bn.cmp(0) === 0) + 0); break;
      case Opcode.map.OP_0NOTEQUAL:  bn = BN((bn.cmp(0) !== 0) + 0); break;
      //default:      assert(!"invalid opcode"); break; // TODO: does this ever occur?
      }
      this.stack.pop();
      this.stack.push(bn.toCScriptNumBuffer());
    }
    break;

    case Opcode.map.OP_ADD:
    case Opcode.map.OP_SUB:
    case Opcode.map.OP_BOOLAND:
    case Opcode.map.OP_BOOLOR:
    case Opcode.map.OP_NUMEQUAL:
    case Opcode.map.OP_NUMEQUALVERIFY:
    case Opcode.map.OP_NUMNOTEQUAL:
    case Opcode.map.OP_LESSTHAN:
    case Opcode.map.OP_GREATERTHAN:
    case Opcode.map.OP_LESSTHANOREQUAL:
    case Opcode.map.OP_GREATERTHANOREQUAL:
    case Opcode.map.OP_MIN:
    case Opcode.map.OP_MAX:
    {
      // (x1 x2 -- out)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      // TODO: enable flags here
      // CScriptNum bn1(stacktop(-2), fRequireMinimal);
      // CScriptNum bn2(stacktop(-1), fRequireMinimal);
      // CScriptNum bn(0);
      var bn1 = BN().fromCScriptNumBuffer(this.stack[this.stack.length - 2]);
      var bn2 = BN().fromCScriptNumBuffer(this.stack[this.stack.length - 1]);
      var bn = BN(0);

      switch (opcodenum)
      {
      case Opcode.map.OP_ADD:
        bn = bn1.add(bn2);
        break;

      case Opcode.map.OP_SUB:
        bn = bn1.sub(bn2);
        break;

      // case Opcode.map.OP_BOOLAND:       bn = (bn1 != bnZero && bn2 != bnZero); break;
      case Opcode.map.OP_BOOLAND:       bn = BN(((bn1.cmp(0) !== 0) && (bn2.cmp(0) !== 0)) + 0); break;
      // case Opcode.map.OP_BOOLOR:        bn = (bn1 != bnZero || bn2 != bnZero); break;
      case Opcode.map.OP_BOOLOR:        bn = BN(((bn1.cmp(0) !== 0) || (bn2.cmp(0) !== 0)) + 0); break;
      // case Opcode.map.OP_NUMEQUAL:      bn = (bn1 == bn2); break;
      case Opcode.map.OP_NUMEQUAL:      bn = BN((bn1.cmp(bn2) === 0) + 0); break;
      // case Opcode.map.OP_NUMEQUALVERIFY:    bn = (bn1 == bn2); break;
      case Opcode.map.OP_NUMEQUALVERIFY:    bn = BN((bn1.cmp(bn2) === 0) + 0); break;
      // case Opcode.map.OP_NUMNOTEQUAL:     bn = (bn1 != bn2); break;
      case Opcode.map.OP_NUMNOTEQUAL:     bn = BN((bn1.cmp(bn2) !== 0) + 0); break;
      // case Opcode.map.OP_LESSTHAN:      bn = (bn1 < bn2); break;
      case Opcode.map.OP_LESSTHAN:      bn = BN((bn1.cmp(bn2) < 0) + 0); break;
      // case Opcode.map.OP_GREATERTHAN:     bn = (bn1 > bn2); break;
      case Opcode.map.OP_GREATERTHAN:     bn = BN((bn1.cmp(bn2) > 0) + 0); break;
      // case Opcode.map.OP_LESSTHANOREQUAL:   bn = (bn1 <= bn2); break;
      case Opcode.map.OP_LESSTHANOREQUAL:   bn = BN((bn1.cmp(bn2) <= 0) + 0); break;
      // case Opcode.map.OP_GREATERTHANOREQUAL:  bn = (bn1 >= bn2); break;
      case Opcode.map.OP_GREATERTHANOREQUAL:  bn = BN((bn1.cmp(bn2) >= 0) + 0); break;
      case Opcode.map.OP_MIN:         bn = (bn1.cmp(bn2) < 0 ? bn1 : bn2); break;
      case Opcode.map.OP_MAX:         bn = (bn1.cmp(bn2) > 0 ? bn1 : bn2); break;
      // default:           assert(!"invalid opcode"); break; //TODO: does this ever occur?
      }
      this.stack.pop();
      this.stack.pop();
      this.stack.push(bn.toCScriptNumBuffer());

      if (opcodenum === Opcode.map.OP_NUMEQUALVERIFY)
      {
        // if (CastToBool(stacktop(-1)))
        if (bn.cmp(0) === 0)
          this.stack.pop();
        else {
          this.errstr = "SCRIPT_ERR_NUMEQUALVERIFY";
          return false;
        }
      }
    }
    break;

    case Opcode.map.OP_WITHIN:
    {
      // (x min max -- out)
      if (this.stack.length < 3) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      // TODO: enable flags here
      // CScriptNum bn1(stacktop(-3), fRequireMinimal);
      // CScriptNum bn2(stacktop(-2), fRequireMinimal);
      // CScriptNum bn3(stacktop(-1), fRequireMinimal);
      var b1 = BN().fromCScriptNumBuffer(this.stack[this.stack.length - 3]);
      var b2 = BN().fromCScriptNumBuffer(this.stack[this.stack.length - 2]);
      var b3 = BN().fromCScriptNumBuffer(this.stack[this.stack.length - 1]);
      //bool fValue = (bn2 <= bn1 && bn1 < bn3);
      var fValue = (bn2.cmp(bn1) <= 0) && (bn1.cmp(bn3) < 0);
      this.stack.pop();
      this.stack.pop();
      this.stack.pop();
      this.stack.push(fValue ? Interp.true : Interp.false);
    }
    break;


    //
    // Crypto
    //
    case Opcode.map.OP_RIPEMD160:
    case Opcode.map.OP_SHA1:
    case Opcode.map.OP_SHA256:
    case Opcode.map.OP_HASH160:
    case Opcode.map.OP_HASH256:
    {
      // (in -- hash)
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      var vch = this.stack[this.stack.length - 1];
      //valtype vchHash((opcode == Opcode.map.OP_RIPEMD160 || opcode == Opcode.map.OP_SHA1 || opcode == Opcode.map.OP_HASH160) ? 20 : 32);
      var vchHash;
      if (opcodenum === Opcode.map.OP_RIPEMD160)
        vchHash = Hash.ripemd160(vch);
      else if (opcodenum === Opcode.map.OP_SHA1)
        vchHash = Hash.sha1(vch);
      else if (opcodenum === Opcode.map.OP_SHA256)
        vchHash = Hash.sha256(vch);
      else if (opcodenum === Opcode.map.OP_HASH160)
        vchHash = Hash.sha256ripemd160(vch);
      else if (opcodenum === Opcode.map.OP_HASH256)
        vchHash = Hash.sha256sha256(vch);
      this.stack.pop();
      this.stack.push(vchHash);
    }
    break;                   

    case Opcode.map.OP_CODESEPARATOR:
    {
      // Hash starts after the code separator
      this.pbegincodehash = this.pc;
    }
    break;

    case Opcode.map.OP_CHECKSIG:
    case Opcode.map.OP_CHECKSIGVERIFY:
    {
      // (sig pubkey -- bool)
      if (this.stack.length < 2) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }

      var vchSig = this.stack[this.stack.length - 2];
      var vchPubkey = this.stack[this.stack.length - 1];

      // Subset of script starting at the most recent codeseparator
      // CScript scriptCode(pbegincodehash, pend);
      var subscript = Script().set({chunks: this.script.chunks.slice(this.pbegincodehash)});

      // Drop the signature, since there's no way for a signature to sign itself
      subscript.findAndDelete(vchSig);

      // TODO: support checking signature encoding with flags
      // if (!CheckSignatureEncoding(vchSig, flags, serror)) {
      //   //serror is set
      //   return false;
      // }

      // TODO: check public key encoding with flags
      // bool fSuccess = CheckPubKeyEncoding(vchPubKey, flags) && checker.CheckSig(vchSig, vchPubKey, scriptCode);
      var sig = Signature().fromTx(vchSig);
      var pubkey = Pubkey().fromBuffer(vchPubkey);
      var fSuccess = this.tx.verify(sig, pubkey, this.nin, subscript);

      this.stack.pop();
      this.stack.pop();
      // stack.push_back(fSuccess ? vchTrue : vchFalse);
      this.stack.push(fSuccess ? Interp.true : Interp.false);
      if (opcodenum === Opcode.map.OP_CHECKSIGVERIFY)
      {
        if (fSuccess)
          this.stack.pop();
        else {
          this.errstr = "SCRIPT_ERR_CHECKSIGVERIFY";
          return false;
        }
      }
    }
    break;

    case Opcode.map.OP_CHECKMULTISIG:
    case Opcode.map.OP_CHECKMULTISIGVERIFY:
    {
      // ([sig ...] num_of_signatures [pubkey ...] num_of_pubkeys -- bool)

      var i = 1;
      if (this.stack.length < i) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }

      // TODO: flags: fRequireMinimal
      // int nKeysCount = CScriptNum(stacktop(-i), fRequireMinimal).getint();
      var nKeysCount = BN().fromCScriptNumBuffer(this.stack[this.stack.length - i]).toNumber();
      if (nKeysCount < 0 || nKeysCount > 20) {
        this.errstr = "SCRIPT_ERR_PUBKEY_COUNT";
        return false;
      }
      this.nOpCount += nKeysCount;
      if (this.nOpCount > 201) {
        this.errstr = "SCRIPT_ERR_OP_COUNT";
        return false;
      }
      // int ikey = ++i;
      var ikey = ++i;
      i += nKeysCount;
      if (this.stack.length < i) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }

      // int nSigsCount = CScriptNum(stacktop(-i), fRequireMinimal).getint();
      var nSigsCount = BN().fromCScriptNumBuffer(this.stack[this.stack.length - 1]).toNumber();
      if (nSigsCount < 0 || nSigsCount > nKeysCount) {
        this.errstr = "SCRIPT_ERR_SIG_COUNT";
        return false;
      }
      // int isig = ++i;
      var isig = ++i;
      i += nSigsCount;
      if (this.stack.length < i) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }

      // Subset of script starting at the most recent codeseparator
      var subscript = Script().set({chunks: this.script.chunks.slice(this.pbegincodehash)});

      // Drop the signatures, since there's no way for a signature to sign itself
      for (var k = 0; k < nSigsCount; k++)
      {
        var vchSig = this.stack[this.stack.length - isig - k];
        subscript.findAndDelete(vchSig);
      }

      var fSuccess = true;
      while (fSuccess && nSigsCount > 0)
      {
        // valtype& vchSig  = stacktop(-isig);
        var vchSig = this.stack[this.stack.length - isig];
        // valtype& vchPubKey = stacktop(-ikey);
        var vchPubKey = this.stack[this.stack.length - ikey];

        // TODO: flags here
        // if (!CheckSignatureEncoding(vchSig, flags, serror)) {
        //   // serror is set
        //   return false;
        // }

        // Check signature
        // TODO: check encodings here
        // bool fOk = CheckPubKeyEncoding(vchPubKey, flags) && checker.CheckSig(vchSig, vchPubKey, scriptCode);
        var sig = Signature().fromTx(vchSig);
        var pubkey = Pubkey().fromBuffer(vchPubkey);
        var fOk = this.tx.verify(sig, pubkey, this.nin, subscript);

        if (fOk) {
          isig++;
          nSigsCount--;
        }
        ikey++;
        nKeysCount--;

        // If there are more signatures left than keys left,
        // then too many signatures have failed
        if (nSigsCount > nKeysCount)
          fSuccess = false;
      }

      // Clean up stack of actual arguments
      while (i-- > 1)
        this.stack.pop();

      // A bug causes CHECKMULTISIG to consume one extra argument
      // whose contents were not checked in any way.
      //
      // Unfortunately this is a potential source of mutability,
      // so optionally verify it is exactly equal to zero prior
      // to removing it from the stack.
      if (this.stack.length < 1) {
        this.errstr = "SCRIPT_ERR_INVALID_STACK_OPERATION";
        return false;
      }
      // TODO: flags here
      // if ((flags & SCRIPT_VERIFY_NULLDUMMY) && stacktop(-1).size())
      //   return set_error(serror, SCRIPT_ERR_SIG_NULLDUMMY);
      this.stack.pop();

      // stack.push_back(fSuccess ? vchTrue : vchFalse);
      this.stack.push(fSuccess ? Interp.true : Interp.false);

      if (opcodenum === Opcode.map.OP_CHECKMULTISIGVERIFY)
      {
        if (fSuccess)
          this.stack.pop();
        else {
          this.errstr = "SCRIPT_ERR_CHECKMULTISIGVERIFY";
          return false;
        }
      }
    }
    break;

    default:
      this.errstr = "SCRIPT_ERR_BAD_OPCODE";
      return false;
  }

  return true;
}

Interp.prototype.verify = function(scriptSig, scriptPubkey, tx, nin, flags) {
  this.set({
    script: scriptSig,
    tx: tx,
    nin: nin,
    flags: flags
  });

  if (!this.eval())
    return false;

  // TODO: flags: p2sh stack copy here
  // if (flags & Interp.SCRIPT_VERIFY_P2SH)
  //   var stackCopy = this.stack;

  var stack = this.stack;
  this.initialize();
  this.set({
    script: scriptPubkey,
    stack: stack,
    tx: tx,
    nin: nin,
    flags: flags
  });

  if (!this.eval())
    return false;

  if (this.stack.length === 0) {
    this.errstr = "SCRIPT_ERR_EVAL_FALSE";
    return false;
  }

  var buf = this.stack[this.stack.length - 1];
  if (!Interp.castToBool(buf)) {
    this.errstr = "SCRIPT_ERR_EVAL_FALSE";
    return false;
  }

  // TODO: flags: insert p2sh support here

  return true;
};
