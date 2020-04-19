'use strict'

var should = require('chai').should()
var bsv = require('../..')
var Interpreter = bsv.Script.Interpreter
var Transaction = bsv.Transaction
var PrivateKey = bsv.PrivateKey
var Script = bsv.Script
var BN = bsv.crypto.BN
var BufferWriter = bsv.encoding.BufferWriter
var Opcode = bsv.Opcode
var _ = require('../../lib/util/_')

var scriptTests = require('../data/bitcoind/script_tests')
var txValid = require('../data/bitcoind/tx_valid')
var txInvalid = require('../data/bitcoind/tx_invalid')

// the script string format used in bitcoind data tests
Script.fromBitcoindString = function (str) {
  var bw = new BufferWriter()
  var tokens = str.split(' ')
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]
    if (token === '') {
      continue
    }

    var opstr
    var opcodenum
    var tbuf
    if (token[0] === '0' && token[1] === 'x') {
      var hex = token.slice(2)
      bw.write(Buffer.from(hex, 'hex'))
    } else if (token[0] === '\'') {
      var tstr = token.slice(1, token.length - 1)
      var cbuf = Buffer.from(tstr)
      tbuf = Script().add(cbuf).toBuffer()
      bw.write(tbuf)
    } else if (typeof Opcode['OP_' + token] !== 'undefined') {
      opstr = 'OP_' + token
      opcodenum = Opcode[opstr]
      bw.writeUInt8(opcodenum)
    } else if (typeof Opcode[token] === 'number') {
      opstr = token
      opcodenum = Opcode[opstr]
      bw.writeUInt8(opcodenum)
    } else if (!isNaN(parseInt(token))) {
      var script = Script().add(new BN(token).toScriptNumBuffer())
      tbuf = script.toBuffer()
      bw.write(tbuf)
    } else {
      throw new Error('Could not determine type of script value')
    }
  }
  var buf = bw.concat()
  return this.fromBuffer(buf)
}

describe('Interpreter', function () {
  it('should make a new interp', function () {
    var interp = new Interpreter();
    (interp instanceof Interpreter).should.equal(true)
    interp.stack.length.should.equal(0)
    interp.altstack.length.should.equal(0)
    interp.pc.should.equal(0)
    interp.pbegincodehash.should.equal(0)
    interp.nOpCount.should.equal(0)
    interp.vfExec.length.should.equal(0)
    interp.errstr.should.equal('')
    interp.flags.should.equal(0)
  })
  it('interpreter can set new values for stacks', function () {
    const interp = new Interpreter()
    interp.stack.push(Buffer.from(['stack']))
    interp.stack.length.should.equal(1)
    interp.altstack.push(Buffer.from(['altstack']))
    interp.altstack.length.should.equal(1)
    interp.set({ stack: [], altstack: [] })
    interp.stack.length.should.equal(0)
    interp.altstack.length.should.equal(0)
  })

  describe('@castToBool', function () {
    it('should cast these bufs to bool correctly', function () {
      Interpreter.castToBool(new BN(0).toSM({
        endian: 'little'
      })).should.equal(false)
      Interpreter.castToBool(Buffer.from('0080', 'hex')).should.equal(false) // negative 0
      Interpreter.castToBool(new BN(1).toSM({
        endian: 'little'
      })).should.equal(true)
      Interpreter.castToBool(new BN(-1).toSM({
        endian: 'little'
      })).should.equal(true)

      var buf = Buffer.from('00', 'hex')
      var bool = BN.fromSM(buf, {
        endian: 'little'
      }).cmp(BN.Zero) !== 0
      Interpreter.castToBool(buf).should.equal(bool)
    })
  })

  describe('#verify', function () {
    it('should verify these trivial scripts', function () {
      var verified
      var si = Interpreter()
      verified = si.verify(Script('OP_1'), Script('OP_1'))
      verified.should.equal(true)
      verified = Interpreter().verify(Script('OP_1'), Script('OP_0'))
      verified.should.equal(false)
      verified = Interpreter().verify(Script('OP_0'), Script('OP_1'))
      verified.should.equal(true)
      verified = Interpreter().verify(Script('OP_CODESEPARATOR'), Script('OP_1'))
      verified.should.equal(true)
      verified = Interpreter().verify(Script(''), Script('OP_DEPTH OP_0 OP_EQUAL'))
      verified.should.equal(true)
      verified = Interpreter().verify(Script('OP_1 OP_2'), Script('OP_2 OP_EQUALVERIFY OP_1 OP_EQUAL'))
      verified.should.equal(true)
      verified = Interpreter().verify(Script('9 0x000000000000000010'), Script(''))
      verified.should.equal(true)
      verified = Interpreter().verify(Script('OP_1'), Script('OP_15 OP_ADD OP_16 OP_EQUAL'))
      verified.should.equal(true)
      verified = Interpreter().verify(Script('OP_0'), Script('OP_IF OP_VER OP_ELSE OP_1 OP_ENDIF'))
      verified.should.equal(true)
    })

    it('should verify these simple transaction', function () {
      // first we create a transaction
      var privateKey = new PrivateKey('cSBnVM4xvxarwGQuAfQFwqDg9k5tErHUHzgWsEfD4zdwUasvqRVY')
      var publicKey = privateKey.publicKey
      var fromAddress = publicKey.toAddress()
      var toAddress = 'mrU9pEmAx26HcbKVrABvgL7AwA5fjNFoDc'
      var scriptPubkey = Script.buildPublicKeyHashOut(fromAddress)
      var utxo = {
        address: fromAddress,
        txId: 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458',
        outputIndex: 0,
        script: scriptPubkey,
        satoshis: 100000
      }
      var tx = new Transaction()
        .from(utxo)
        .to(toAddress, 100000)
        .sign(privateKey, 1)

      // we then extract the signature from the first input
      var inputIndex = 0
      var signature = tx.getSignatures(privateKey, 1)[inputIndex].signature

      var scriptSig = Script.buildPublicKeyHashIn(publicKey, signature)
      var flags = Interpreter.SCRIPT_VERIFY_P2SH | Interpreter.SCRIPT_VERIFY_STRICTENC
      var verified = Interpreter().verify(scriptSig, scriptPubkey, tx, inputIndex, flags)
      verified.should.equal(true)
    })
  })

  describe('#script debugger', function () {
    it('debugger should fire while executing script', function () {
      var si = Interpreter()
      let debugCount = 0
      si.stepListener = function (step) {
        debugCount += 1
      }
      si.verify(Script('OP_1 OP_2 OP_ADD'), Script('OP_3 OP_EQUAL'))
      si.errstr.should.equal('')
      // two scripts. first one has 3 instructions. second one has 2 instructions
      debugCount.should.equal(3 + 2)
    })
    it('debugger error in callback should not kill executing script', function () {
      var si = Interpreter()
      si.stepListener = function (step) {
        throw new Error('This error is expected.')
      }
      si.verify(Script('OP_1 OP_2 OP_ADD'), Script(''))
      const result = [...si.stack.pop()]
      result.should.to.deep.equal([3])
      si.errstr.should.equal('')
      si.stack.length.should.equal(0)
    })
    it('script debugger should fire and not cause an error', function () {
      var si = Interpreter()
      si.stepListener = debugScript
      si.verify(Script('OP_1 OP_2 OP_ADD'), Script('OP_3 OP_EQUAL'))
      si.errstr.should.equal('')
    })
    it('script debugger should make copies of stack', function () {
      var si = Interpreter()
      let stk, stkval, altstk, altstkval
      si.stepListener = function (step, stack, altstack) {
        // stack is an array of buffers, interpreter must give us copies of stack so we can't mess it up
        console.log(step)
        console.log(stack)
        console.log(altstack)
        // these values will get overwritten each step but we only care about that final values
        stk = (stack === si.stack)
        stkval = (stack[0] === si.stack[0])
        altstk = (altstack === si.altstack)
        altstkval = (altstack[0] === si.altstack[0])
      }
      // alt stack is not copied to second script execution so just do everything in second script
      si.verify(Script(''), Script('OP_2 OP_TOALTSTACK OP_1'))
      console.log(si.stack)
      console.log(si.altstack)
      si.errstr.should.equal('')
      si.stack.length.should.equal(1)
      si.altstack.length.should.equal(1)
      stk.should.equal(false)
      stkval.should.equal(false)
      altstk.should.equal(false)
      altstkval.should.equal(false)
    })
  })

  var getFlags = function getFlags (flagstr) {
    var flags = 0
    if (flagstr.indexOf('NONE') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_NONE
    }
    if (flagstr.indexOf('P2SH') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_P2SH
    }
    if (flagstr.indexOf('STRICTENC') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_STRICTENC
    }
    if (flagstr.indexOf('DERSIG') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_DERSIG
    }
    if (flagstr.indexOf('LOW_S') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_LOW_S
    }
    if (flagstr.indexOf('NULLDUMMY') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_NULLDUMMY
    }
    if (flagstr.indexOf('SIGPUSHONLY') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_SIGPUSHONLY
    }
    if (flagstr.indexOf('MINIMALDATA') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_MINIMALDATA
    }
    if (flagstr.indexOf('DISCOURAGE_UPGRADABLE_NOPS') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS
    }
    if (flagstr.indexOf('CHECKLOCKTIMEVERIFY') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY
    }
    if (flagstr.indexOf('CHECKSEQUENCEVERIFY') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY
    }
    if (flagstr.indexOf('NULLFAIL') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_NULLFAIL
    }

    if (flagstr.indexOf('CLEANSTACK') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_CLEANSTACK
    }

    if (flagstr.indexOf('FORKID') !== -1) {
      flags = flags | Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID
    }

    if (flagstr.indexOf('REPLAY_PROTECTION') !== -1) {
      flags = flags | Interpreter.SCRIPT_ENABLE_REPLAY_PROTECTION
    }

    if (flagstr.indexOf('MONOLITH') !== -1) {
      flags = flags | Interpreter.SCRIPT_ENABLE_MONOLITH_OPCODES
    }

    if (flagstr.indexOf('MAGNETIC') !== -1) {
      flags = flags | Interpreter.SCRIPT_ENABLE_MAGNETIC_OPCODES
    }

    if (flagstr.indexOf('MINIMALIF') !== -1) {
      flags = flags | Interpreter.SCRIPT_VERIFY_MINIMALIF
    }
    return flags
  }

  var testFixture = function (vector, expected, extraData) {
    var scriptSig = Script.fromBitcoindString(vector[0])
    var scriptPubkey = Script.fromBitcoindString(vector[1])
    var flags = getFlags(vector[2])
    var inputAmount = 0
    if (extraData) {
      inputAmount = extraData[0] * 1e8
    }

    var hashbuf = Buffer.alloc(32)
    hashbuf.fill(0)
    var credtx = new Transaction()
    credtx.uncheckedAddInput(new Transaction.Input({
      prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
      outputIndex: 0xffffffff,
      sequenceNumber: 0xffffffff,
      script: Script('OP_0 OP_0')
    }))
    credtx.addOutput(new Transaction.Output({
      script: scriptPubkey,
      satoshis: inputAmount
    }))
    var idbuf = credtx.id

    var spendtx = new Transaction()
    spendtx.uncheckedAddInput(new Transaction.Input({
      prevTxId: idbuf.toString('hex'),
      outputIndex: 0,
      sequenceNumber: 0xffffffff,
      script: scriptSig
    }))
    spendtx.addOutput(new Transaction.Output({
      script: new Script(),
      satoshis: inputAmount
    }))

    var interp = new Interpreter()
    var verified = interp.verify(scriptSig, scriptPubkey, spendtx, 0, flags, new BN(inputAmount))
    verified.should.equal(expected, interp.errstr)
  }

  const CheckMul = function (a, b, expected) {
    // Negative values for multiplication
    CheckBinaryOpMagnetic(a, b, Opcode.OP_MUL, expected)
    CheckBinaryOpMagnetic(a, NegativeValtype(b), Opcode.OP_MUL, NegativeValtype(expected))
    CheckBinaryOpMagnetic(NegativeValtype(a), b, Opcode.OP_MUL, NegativeValtype(expected))
    CheckBinaryOpMagnetic(NegativeValtype(a), NegativeValtype(b), Opcode.OP_MUL, expected)

    // Commutativity
    CheckBinaryOpMagnetic(b, a, Opcode.OP_MUL, expected)
    CheckBinaryOpMagnetic(b, NegativeValtype(a), Opcode.OP_MUL, NegativeValtype(expected))
    CheckBinaryOpMagnetic(NegativeValtype(b), a, Opcode.OP_MUL, NegativeValtype(expected))
    CheckBinaryOpMagnetic(NegativeValtype(b), NegativeValtype(a), Opcode.OP_MUL, expected)

    // Multiplication identities
    CheckBinaryOpMagnetic(a, [0x01], Opcode.OP_MUL, a)
    CheckBinaryOpMagnetic(a, [0x81], Opcode.OP_MUL, NegativeValtype(a))
    CheckBinaryOpMagnetic(a, [], Opcode.OP_MUL, [])

    CheckBinaryOpMagnetic([0x01], b, Opcode.OP_MUL, b)
    CheckBinaryOpMagnetic([0x81], b, Opcode.OP_MUL, NegativeValtype(b))
    CheckBinaryOpMagnetic([], b, Opcode.OP_MUL, [])
  }

  const CheckBinaryOpMagnetic = function (a, b, op, expected) {
    const interp = evaluateScript(a, b, op)
    const result = [...interp.stack.pop()]
    result.should.to.deep.equal(expected)
  }

  const NegativeValtype = function (v) {
    let copy = v.slice()
    if (copy.length) {
      copy[copy.length - 1] ^= 0x80
    }
    // TODO: expose minimally encode as public method?
    return Interpreter._minimallyEncode(copy)
  }

  const evaluateScript = function (arraySig, arrayPubKey, op, funcDebug) {
    const interp = new Interpreter()
    interp.stepListener = funcDebug
    interp.script = new Script().add(Buffer.from(arraySig)).add(Buffer.from(arrayPubKey))
    interp.script.add(op)
    interp.flags = Interpreter.SCRIPT_VERIFY_P2SH |
      Interpreter.SCRIPT_ENABLE_MAGNETIC_OPCODES | Interpreter.SCRIPT_ENABLE_MONOLITH_OPCODES
    interp.evaluate()
    return interp
  }

  const debugScript = function (step, stack, altstack) {
    const script = (new Script()).add(step.opcode)
    // stack is array of buffers
    let stackTop = '>'
    for (let item in stack.reverse()) {
      console.log(`Step ${step.pc}: ${script}:${stackTop}${stack[item].toString('hex')}`)
      stackTop = ' '
    }
  }

  const toBitpattern = function (binaryString) {
    return parseInt(binaryString, 2).toString(16).padStart(8, '0')
  }

  describe('#Empty and null script', function () {
    it('Empty buffer should have value 0x00 in script', function () {
      const s = new Script().add(Buffer.from([]))
      // script does not render anything so it appears invisible
      s.toString().should.equal('')
      // yet there is a script chunk there
      s.chunks.length.should.equal(1)
      s.chunks[0].opcodenum.should.equal(0)
    })
    it('Zero value (0x00) buffer should have value 0x01 0x00 in script', function () {
      const s = new Script().add(Buffer.from([0x00]))
      s.toString().should.equal('1 0x00')
      s.chunks.length.should.equal(1)
      s.chunks[0].opcodenum.should.equal(1)
    })
  })

  describe('#NegativeValType', function () {
    it('should pass all tests', function () {
      // Test zero values
      new Script().add(Buffer.from(NegativeValtype([]))).should.to.deep.equal(new Script().add(Buffer.from([])))
      new Script().add(Buffer.from(NegativeValtype([0x00]))).should.to.deep.equal(new Script().add(Buffer.from([])))
      new Script().add(Buffer.from(NegativeValtype([0x80]))).should.to.deep.equal(new Script().add(Buffer.from([])))
      new Script().add(Buffer.from(NegativeValtype([0x00, 0x00]))).should.to.deep.equal(new Script().add(Buffer.from([])))
      new Script().add(Buffer.from(NegativeValtype([0x00, 0x80]))).should.to.deep.equal(new Script().add(Buffer.from([])))

      // Non-zero values
      NegativeValtype([0x01]).should.to.deep.equal([0x81])
      NegativeValtype([0x81]).should.to.deep.equal([0x01])
      NegativeValtype([0x02, 0x01]).should.to.deep.equal([0x02, 0x81])
      NegativeValtype([0x02, 0x81]).should.to.deep.equal([0x02, 0x01])
      NegativeValtype([0xff, 0x02, 0x01]).should.to.deep.equal([0xff, 0x02, 0x81])
      NegativeValtype([0xff, 0x02, 0x81]).should.to.deep.equal([0xff, 0x02, 0x01])
      NegativeValtype([0xff, 0xff, 0x02, 0x01]).should.to.deep.equal([0xff, 0xff, 0x02, 0x81])
      NegativeValtype([0xff, 0xff, 0x02, 0x81]).should.to.deep.equal([0xff, 0xff, 0x02, 0x01])

      // Should not be overly-minimized
      NegativeValtype([0xff, 0x80]).should.to.deep.equal([0xff, 0x00])
      NegativeValtype([0xff, 0x00]).should.to.deep.equal([0xff, 0x80])
    })
  })

  describe('#OP_LSHIFT tests from bitcoind', function () {
    it('should not shift when no n value', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [], Opcode.OP_LSHIFT)
      console.log(interp.script)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('10011111000100011111010101010101'))
    })
    it('should shift left 1', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x01], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00111110001000111110101010101010'))
    })
    it('should shift left 2', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x02], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('01111100010001111101010101010100'))
    })
    it('should shift left 3', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x03], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('11111000100011111010101010101000'))
    })
    it('should shift left 4', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x04], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('11110001000111110101010101010000'))
    })
    it('should shift left 5', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x05], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('11100010001111101010101010100000'))
    })
    it('should shift left 6', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x06], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('11000100011111010101010101000000'))
    })
    it('should shift left 7', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x07], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('10001000111110101010101010000000'))
    })
    it('should shift left 08', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x08], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00010001111101010101010100000000'))
    })
    it('should shift left 9', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x09], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00100011111010101010101000000000'))
    })
    it('should shift left 0A', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0A], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('01000111110101010101010000000000'))
    })
    it('should shift left 0B', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0B], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('10001111101010101010100000000000'))
    })
    it('should shift left 0C', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0C], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00011111010101010101000000000000'))
    })
    it('should shift left 0D', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0D], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00111110101010101010000000000000'))
    })
    it('should shift left 0E', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0E], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('01111101010101010100000000000000'))
    })
    it('should shift left 0F', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0F], Opcode.OP_LSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('11111010101010101000000000000000'))
    })
  })

  describe('#OP_RSHIFT tests from bitcoind', function () {
    it('should not shift when no n value', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('10011111000100011111010101010101'))
    })
    it('should shift right 1', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x01], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('01001111100010001111101010101010'))
    })
    it('should shift right 2', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x02], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00100111110001000111110101010101'))
    })
    it('should shift right 3', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x03], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00010011111000100011111010101010'))
    })
    it('should shift right 4', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x04], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00001001111100010001111101010101'))
    })
    it('should shift right 5', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x05], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000100111110001000111110101010'))
    })
    it('should shift right 6', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x06], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000010011111000100011111010101'))
    })
    it('should shift right 7', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x07], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000001001111100010001111101010'))
    })
    it('should shift right 08', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x08], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000100111110001000111110101'))
    })
    it('should shift right 9', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x09], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000010011111000100011111010'))
    })
    it('should shift right 0A', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0A], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000001001111100010001111101'))
    })
    it('should shift right 0B', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0B], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000000100111110001000111110'))
    })
    it('should shift right 0C', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0C], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000000010011111000100011111'))
    })
    it('should shift right 0D', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0D], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000000001001111100010001111'))
    })
    it('should shift right 0E', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0E], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000000000100111110001000111'))
    })
    it('should shift right 0F', function () {
      const interp = evaluateScript([0x9F, 0x11, 0xF5, 0x55], [0x0F], Opcode.OP_RSHIFT)
      const result = interp.stack.pop()
      result.toString('hex').should.equal(toBitpattern('00000000000000010011111000100011'))
    })
  })
  describe('#OP_MUL tests from bitcoind', function () {
    it('OP_MUL tests', function () {
      CheckMul([0x05], [0x06], [0x1E])
      CheckMul([0x05], [0x26], [0xBE, 0x00])
      CheckMul([0x45], [0x26], [0x3E, 0x0A])
      CheckMul([0x02], [0x56, 0x24], [0xAC, 0x48])
      CheckMul([0x05], [0x26, 0x03, 0x32], [0xBE, 0x0F, 0xFA, 0x00])
      CheckMul([0x06], [0x26, 0x03, 0x32, 0x04], [0xE4, 0x12, 0x2C, 0x19])
      CheckMul([0xA0, 0xA0], [0xF5, 0xE4], [0x20, 0xB9, 0xDD, 0x0C]) // -20A0*-64F5=0CDDB920
      CheckMul([0x05, 0x26], [0x26, 0x03, 0x32], [0xBE, 0xB3, 0x71, 0x6D, 0x07])
      CheckMul([0x06, 0x26], [0x26, 0x03, 0x32, 0x04], [0xE4, 0xB6, 0xA3, 0x85, 0x9F, 0x00])
      CheckMul([0x05, 0x26, 0x09], [0x26, 0x03, 0x32], [0xBE, 0xB3, 0xC7, 0x89, 0xC9, 0x01])
      CheckMul([0x06, 0x26, 0x09], [0x26, 0x03, 0x32, 0x04], [0xE4, 0xB6, 0xF9, 0xA1, 0x61, 0x26])
      CheckMul([0x06, 0x26, 0x09, 0x34], [0x26, 0x03, 0x32, 0x04], [0xE4, 0xB6, 0xF9, 0x59, 0x05, 0x4F, 0xDA, 0x00])
    })
  })

  describe('bitcoind script evaluation fixtures', function () {
    var testAllFixtures = function (set) {
      var c = 0; var l = set.length
      set.forEach(function (vector) {
        if (vector.length === 1) {
          return
        }
        c++

        var extraData
        if (_.isArray(vector[0])) {
          extraData = vector.shift()
        }

        var fullScriptString = `${vector[0]} ${vector[1]}`
        var expected = vector[3] === 'OK'
        var descstr = vector[4]
        var comment = descstr ? (` (${descstr})`) : ''
        var txt = `should ${vector[3]} script_tests vector #${c}/${l}: ${fullScriptString}${comment}`

        it(txt, function () { testFixture(vector, expected, extraData) })
      })
    }
    testAllFixtures(scriptTests)
  })
  describe('bitcoind transaction evaluation fixtures', function () {
    var testTxs = function (set, expected) {
      var c = 0
      set.forEach(function (vector) {
        if (vector.length === 1) {
          return
        }
        c++
        var cc = c // copy to local
        it('should pass tx_' + (expected ? '' : 'in') + 'valid vector ' + cc, function () {
          var inputs = vector[0]
          var txhex = vector[1]

          var flags = getFlags(vector[2])
          var map = {}
          inputs.forEach(function (input) {
            var txid = input[0]
            var txoutnum = input[1]
            var scriptPubKeyStr = input[2]
            if (txoutnum === -1) {
              txoutnum = 0xffffffff // bitcoind casts -1 to an unsigned int
            }
            map[txid + ':' + txoutnum] = Script.fromBitcoindString(scriptPubKeyStr)
          })

          var tx = new Transaction(txhex)
          var allInputsVerified = true
          tx.inputs.forEach(function (txin, j) {
            if (txin.isNull()) {
              return
            }
            var scriptSig = txin.script
            var txidhex = txin.prevTxId.toString('hex')
            var txoutnum = txin.outputIndex
            var scriptPubkey = map[txidhex + ':' + txoutnum]
            should.exist(scriptPubkey);
            (scriptSig !== undefined).should.equal(true)
            var interp = new Interpreter()
            var verified = interp.verify(scriptSig, scriptPubkey, tx, j, flags)
            if (!verified) {
              allInputsVerified = false
            }
          })
          var txVerified = tx.verify()
          txVerified = (txVerified === true)
          allInputsVerified = allInputsVerified && txVerified
          allInputsVerified.should.equal(expected)
        })
      })
    }
    testTxs(txValid, true)
    testTxs(txInvalid, false)
  })
})
