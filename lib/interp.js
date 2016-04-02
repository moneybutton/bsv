/**
 * Script Interpreter
 * ==================
 *
 * Bitcoin transactions contain scripts. Each input has a script called the
 * scriptSig, and each output has a script called the scriptPubkey. To validate
 * an input, the ScriptSig is executed, then with the same stack, the
 * scriptPubkey from the output corresponding to that input is run. The primary
 * way to use this class is via the verify function:
 *
 * Interp().verify( ... )
 *
 * In some ways, the script interpreter is one of the most poorly architected
 * components of Fullnode because of the giant switch statement in step(). But
 * that is deliberately so to make it similar to bitcoin core, and thus easier
 * to audit.
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  BW: require('./bw'),
  cmp: require('./cmp'),
  Hash: require('./hash'),
  Opcode: require('./opcode'),
  Pubkey: require('./pubkey'),
  Script: require('./script'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  Txin: require('./txin')
}

let inject = function (deps) {
  let BN = deps.BN
  let BW = deps.BW
  let cmp = deps.cmp
  let Hash = deps.Hash
  let Opcode = deps.Opcode
  let Pubkey = deps.Pubkey
  let Script = deps.Script
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Txin = deps.Txin

  function Interp (script, tx, nin, stack, altstack, pc, pbegincodehash, nOpCount, ifstack, errstr, flags) {
    if (!(this instanceof Interp)) {
      return new Interp(script, tx, nin, stack, altstack, pc, pbegincodehash, nOpCount, ifstack, errstr, flags)
    }
    this.initialize()
    this.fromObject({script, tx, nin, stack, altstack, pc, pbegincodehash, nOpCount, ifstack, errstr, flags})
  }

  Interp.prototype = Object.create(Struct.prototype)
  Interp.prototype.constructor = Interp

  Interp.prototype.initialize = function (obj) {
    this.stack = []
    this.altstack = []
    this.pc = 0
    this.pbegincodehash = 0
    this.nOpCount = 0
    this.ifstack = []
    this.errstr = ''
    this.flags = 0
    return this
  }

  Interp.prototype.fromJSON = function (json) {
    this.fromJSONNoTx(json)
    this.tx = json.tx ? Tx().fromJSON(json.tx) : undefined
    return this
  }

  /**
   * Convert JSON containing everything but the tx to an interp object.
   */
  Interp.prototype.fromJSONNoTx = function (json) {
    this.fromObject({
      script: json.script !== undefined ? Script().fromJSON(json.script) : undefined,
      nin: json.nin
    })
    this.stack = []
    json.stack.forEach(function (hex) {
      this.stack.push(new Buffer(hex, 'hex'))
    }.bind(this))
    this.altstack = []
    json.altstack.forEach(function (hex) {
      this.altstack.push(new Buffer(hex, 'hex'))
    }.bind(this))
    this.fromObject({
      pc: json.pc,
      pbegincodehash: json.pbegincodehash,
      nOpCount: json.nOpCount,
      ifstack: json.ifstack,
      errstr: json.errstr,
      flags: json.flags
    })
    return this
  }

  Interp.prototype.fromBR = function (br) {
    let jsonNoTxBufLen = br.readVarintNum()
    let jsonNoTxBuf = br.read(jsonNoTxBufLen)
    this.fromJSONNoTx(JSON.parse(jsonNoTxBuf.toString()))
    let txbuflen = br.readVarintNum()
    if (txbuflen > 0) {
      let txbuf = br.read(txbuflen)
      this.tx = Tx().fromFastBuffer(txbuf)
    }
    return this
  }

  Interp.prototype.toJSON = function () {
    let json = this.toJSONNoTx()
    json.tx = this.tx ? this.tx.toJSON() : undefined
    return json
  }

  /**
   * Convert everything but the tx to JSON.
   */
  Interp.prototype.toJSONNoTx = function () {
    let stack = []
    this.stack.forEach(function (buf) {
      stack.push(buf.toString('hex'))
    })
    let altstack = []
    this.altstack.forEach(function (buf) {
      altstack.push(buf.toString('hex'))
    })
    return {
      script: this.script ? this.script.toJSON() : undefined,
      nin: this.nin,
      stack: stack,
      altstack: altstack,
      pc: this.pc,
      pbegincodehash: this.pbegincodehash,
      nOpCount: this.nOpCount,
      ifstack: this.ifstack,
      errstr: this.errstr,
      flags: this.flags
    }
  }

  Interp.prototype.toBW = function (bw) {
    if (!bw) {
      bw = BW()
    }
    let jsonNoTxBuf = new Buffer(JSON.stringify(this.toJSONNoTx()))
    bw.writeVarintNum(jsonNoTxBuf.length)
    bw.write(jsonNoTxBuf)
    if (this.tx) {
      let txbuf = this.tx.toFastBuffer()
      bw.writeVarintNum(txbuf.length)
      bw.write(txbuf)
    } else {
      bw.writeVarintNum(0)
    }
    return bw
  }

  Interp.true = new Buffer([1])
  Interp.false = new Buffer([])

  Interp.MAX_SCRIPT_ELEMENT_SIZE = 520
  Interp.LOCKTIME_THRESHOLD = 500000000 // Tue Nov  5 00:53:20 1985 UTC

  // flags taken from bitcoin core
  // bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
  Interp.SCRIPT_VERIFY_NONE = 0

  // Evaluate P2SH subscripts (softfork safe, BIP16).
  Interp.SCRIPT_VERIFY_P2SH = (1 << 0)

  // Passing a non-strict-DER signature or one with undefined hashtype to a checksig operation causes script failure.
  // Passing a pubkey that is not (0x04 + 64 bytes) or (0x02 or 0x03 + 32 bytes) to checksig causes that pubkey to be
  // skipped (not softfork safe: this flag can widen the validity of OP_CHECKSIG OP_NOT).
  Interp.SCRIPT_VERIFY_STRICTENC = (1 << 1)

  // Passing a non-strict-DER signature to a checksig operation causes script failure (softfork safe, BIP62 rule 1)
  Interp.SCRIPT_VERIFY_DERSIG = (1 << 2)

  // Passing a non-strict-DER signature or one with S > order/2 to a checksig operation causes script failure
  // (softfork safe, BIP62 rule 5).
  Interp.SCRIPT_VERIFY_LOW_S = (1 << 3)

  // verify dummy stack item consumed by CHECKMULTISIG is of zero-length (softfork safe, BIP62 rule 7).
  Interp.SCRIPT_VERIFY_NULLDUMMY = (1 << 4)

  // Using a non-push operator in the scriptSig causes script failure (softfork safe, BIP62 rule 2).
  Interp.SCRIPT_VERIFY_SIGPUSHONLY = (1 << 5)

  // Require minimal encodings for all push operations (OP_0... OP_16, OP_1NEGATE where possible, direct
  // pushes up to 75 bytes, OP_PUSHDATA up to 255 bytes, OP_PUSHDATA2 for anything larger). Evaluating
  // any other push causes the script to fail (BIP62 rule 3).
  // In addition, whenever a stack element is interpreted as a number, it must be of minimal length (BIP62 rule 4).
  // (softfork safe)
  Interp.SCRIPT_VERIFY_MINIMALDATA = (1 << 6)

  // Discourage use of NOPs reserved for upgrades (NOP1-10)
  //
  // Provided so that nodes can avoid accepting or mining transactions
  // containing executed NOP's whose meaning may change after a soft-fork,
  // thus rendering the script invalid; with this flag set executing
  // discouraged NOPs fails the script. This verification flag will never be
  // a mandatory flag applied to scripts in a block. NOPs that are not
  // executed, e.g.  within an unexecuted IF ENDIF block, are *not* rejected.
  Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS = (1 << 7)

  // Require that only a single stack element remains after evaluation. This
  // changes the success criterion from "At least one stack element must
  // remain, and when interpreted as a boolean, it must be true" to "Exactly
  // one stack element must remain, and when interpreted as a boolean, it must
  // be true".  (softfork safe, BIP62 rule 6)
  // Note: CLEANSTACK should never be used without P2SH.
  Interp.SCRIPT_VERIFY_CLEANSTACK = (1 << 8)

  // Verify CHECKLOCKTIMEVERIFY
  //
  // See BIP65 for details.
  Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY = (1 << 9)

  /**
   * In order to make auduting the script interpreter easier, we use the same
   * constants as bitcoin core, including the flags, which customize the
   * operation of the interpreter.
   */
  Interp.getFlags = function (flagstr) {
    let flags = 0
    if (flagstr.indexOf('NONE') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_NONE
    }
    if (flagstr.indexOf('P2SH') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_P2SH
    }
    if (flagstr.indexOf('STRICTENC') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_STRICTENC
    }
    if (flagstr.indexOf('DERSIG') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_DERSIG
    }
    if (flagstr.indexOf('LOW_S') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_LOW_S
    }
    if (flagstr.indexOf('NULLDUMMY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_NULLDUMMY
    }
    if (flagstr.indexOf('SIGPUSHONLY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_SIGPUSHONLY
    }
    if (flagstr.indexOf('MINIMALDATA') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_MINIMALDATA
    }
    if (flagstr.indexOf('DISCOURAGE_UPGRADABLE_NOPS') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS
    }
    if (flagstr.indexOf('CLEANSTACK') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_CLEANSTACK
    }
    if (flagstr.indexOf('CHECKLOCKTIMEVERIFY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY
    }
    return flags
  }

  Interp.castToBool = function (buf) {
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] !== 0) {
        // can be negative zero
        if (i === buf.length - 1 && buf[i] === 0x80) {
          return false
        }
        return true
      }
    }
    return false
  }

  /**
   * Translated from bitcoin core's CheckSigEncoding
   */
  Interp.prototype.checkSigEncoding = function (buf) {
    // Empty signature. Not strictly DER encoded, but allowed to provide a
    // compact way to provide an invalid signature for use with CHECK(MULTI)SIG
    if (buf.length === 0) {
      return true
    }
    if ((this.flags & (Interp.SCRIPT_VERIFY_DERSIG | Interp.SCRIPT_VERIFY_LOW_S | Interp.SCRIPT_VERIFY_STRICTENC)) !== 0 && !Sig.isTxDER(buf)) {
      this.errstr = 'SCRIPT_ERR_SIG_DER'
      return false
    } else if ((this.flags & Interp.SCRIPT_VERIFY_LOW_S) !== 0) {
      let sig = Sig().fromTxFormat(buf)
      if (!sig.hasLowS()) {
        this.errstr = 'SCRIPT_ERR_SIG_DER'
        return false
      }
    } else if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0) {
      let sig = Sig().fromTxFormat(buf)
      if (!sig.hasDefinedHashtype()) {
        this.errstr = 'SCRIPT_ERR_SIG_HASHTYPE'
        return false
      }
    }
    return true
  }

  /**
   * Translated from bitcoin core's CheckPubKeyEncoding
   */
  Interp.prototype.checkPubkeyEncoding = function (buf) {
    if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0 && !Pubkey.isCompressedOrUncompressed(buf)) {
      this.errstr = 'SCRIPT_ERR_PUBKEYTYPE'
      return false
    }
    return true
  }

  /**
   * Translated from bitcoin core's CheckLockTime
   */
  Interp.prototype.checkLockTime = function (nlocktime) {
    // There are two kinds of nLockTime: lock-by-blockheight
    // and lock-by-blocktime, distinguished by whether
    // nLockTime < LOCKTIME_THRESHOLD.
    //
    // We want to compare apples to apples, so fail the script
    // unless the type of nLockTime being tested is the same as
    // the nLockTime in the transaction.
    if (!(
        (this.tx.nlocktime < Interp.LOCKTIME_THRESHOLD && nlocktime < Interp.LOCKTIME_THRESHOLD) ||
        (this.tx.nlocktime >= Interp.LOCKTIME_THRESHOLD && nlocktime >= Interp.LOCKTIME_THRESHOLD)
    )) {
      return false
    }

    // Now that we know we're comparing apples-to-apples, the
    // comparison is a simple numeric one.
    if (nlocktime > this.tx.nlocktime) {
      return false
    }

    // Finally the nLockTime feature can be disabled and thus
    // CHECKLOCKTIMEVERIFY bypassed if every txin has been
    // finalized by setting nSequence to maxint. The
    // transaction would be allowed into the blockchain, making
    // the opcode ineffective.
    //
    // Testing if this vin is not final is sufficient to
    // prevent this condition. Alternatively we could test all
    // inputs, but testing just this input minimizes the data
    // required to prove correct CHECKLOCKTIMEVERIFY execution.
    if (Txin.SEQUENCE_FINAL === this.tx.txins[this.nin].seqnum) {
      return false
    }

    return true
  }

  /**
   * Based on bitcoin core's EvalScript function, with the inner loop moved to
   * Interp.prototype.step()
   * bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
   */
  Interp.prototype.eval = function *() {
    if (this.script.toBuffer().length > 10000) {
      this.errstr = 'SCRIPT_ERR_SCRIPT_SIZE'
      yield false
    }

    try {
      while (this.pc < this.script.chunks.length) {
        let fSuccess = this.step()
        if (!fSuccess) {
          yield false
        } else {
          yield fSuccess
        }
      }

      // Size limits
      if (this.stack.length + this.altstack.length > 1000) {
        this.errstr = 'SCRIPT_ERR_STACK_SIZE'
        yield false
      }
    } catch (e) {
      this.errstr = 'SCRIPT_ERR_UNKNOWN_ERROR: ' + e
      yield false
    }

    if (this.ifstack.length > 0) {
      this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
      yield false
    }

    yield true
  }

  /**
   * Based on the inner loop of bitcoin core's EvalScript function
   * bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
   */
  Interp.prototype.step = function () {
    let fRequireMinimal = (this.flags & Interp.SCRIPT_VERIFY_MINIMALDATA) !== 0

    // bool fExec = !count(ifstack.begin(), ifstack.end(), false)
    let fExec = !(this.ifstack.indexOf(false) + 1)

    //
    // Read instruction
    //
    let chunk = this.script.chunks[this.pc]
    this.pc++
    let opcodenum = chunk.opcodenum
    if (opcodenum === undefined) {
      this.errstr = 'SCRIPT_ERR_BAD_OPCODE'
      return false
    }
    if (chunk.buf && chunk.buf.length > Interp.MAX_SCRIPT_ELEMENT_SIZE) {
      this.errstr = 'SCRIPT_ERR_PUSH_SIZE'
      return false
    }

    // Note how Opcode.OP_RESERVED does not count towards the opcode limit.
    if (opcodenum > Opcode.OP_16 && ++(this.nOpCount) > 201) {
      this.errstr = 'SCRIPT_ERR_OP_COUNT'
      return false
    }

    if (opcodenum === Opcode.OP_CAT ||
      opcodenum === Opcode.OP_SUBSTR ||
      opcodenum === Opcode.OP_LEFT ||
      opcodenum === Opcode.OP_RIGHT ||
      opcodenum === Opcode.OP_INVERT ||
      opcodenum === Opcode.OP_AND ||
      opcodenum === Opcode.OP_OR ||
      opcodenum === Opcode.OP_XOR ||
      opcodenum === Opcode.OP_2MUL ||
      opcodenum === Opcode.OP_2DIV ||
      opcodenum === Opcode.OP_MUL ||
      opcodenum === Opcode.OP_DIV ||
      opcodenum === Opcode.OP_MOD ||
      opcodenum === Opcode.OP_LSHIFT ||
      opcodenum === Opcode.OP_RSHIFT) {
      this.errstr = 'SCRIPT_ERR_DISABLED_OPCODE'
      return false
    }

    if (fExec && (opcodenum >= 0) && (opcodenum <= Opcode.OP_PUSHDATA4)) {
      if (fRequireMinimal && !this.script.checkMinimalPush(this.pc - 1)) {
        this.errstr = 'SCRIPT_ERR_MINIMALDATA'
        return false
      }
      if (!chunk.buf) {
        this.stack.push(Interp.false)
      } else if (chunk.len !== chunk.buf.length) {
        throw new Error('Length of push value not equal to length of data')
      } else {
        this.stack.push(chunk.buf)
      }
    } else if (fExec || (Opcode.OP_IF <= opcodenum && opcodenum <= Opcode.OP_ENDIF)) {
      switch (opcodenum) {
        //
        // Push value
        //
        case Opcode.OP_1NEGATE:
        case Opcode.OP_1:
        case Opcode.OP_2:
        case Opcode.OP_3:
        case Opcode.OP_4:
        case Opcode.OP_5:
        case Opcode.OP_6:
        case Opcode.OP_7:
        case Opcode.OP_8:
        case Opcode.OP_9:
        case Opcode.OP_10:
        case Opcode.OP_11:
        case Opcode.OP_12:
        case Opcode.OP_13:
        case Opcode.OP_14:
        case Opcode.OP_15:
        case Opcode.OP_16:
          {
            // ( -- value)
            // ScriptNum bn((int)opcode - (int)(Opcode.OP_1 - 1))
            let n = opcodenum - (Opcode.OP_1 - 1)
            let buf = BN(n).toScriptNumBuffer()
            this.stack.push(buf)
            // The result of these opcodes should always be the minimal way to push the data
            // they push, so no need for a CheckMinimalPush here.
          }
          break

        //
        // Control
        //
        case Opcode.OP_NOP:
          break

        case Opcode.OP_CHECKLOCKTIMEVERIFY:
          {
            if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY)) {
              // not enabled; treat as a NOP2
              if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                this.errstr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS'
                return false
              }
              break
            }

            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }

            // Note that elsewhere numeric opcodes are limited to
            // operands in the range -2**31+1 to 2**31-1, however it is
            // legal for opcodes to produce results exceeding that
            // range. This limitation is implemented by CScriptNum's
            // default 4-byte limit.
            //
            // If we kept to that limit we'd have a year 2038 problem,
            // even though the nLockTime field in transactions
            // themselves is uint32 which only becomes meaningless
            // after the year 2106.
            //
            // Thus as a special case we tell CScriptNum to accept up
            // to 5-byte bignums, which are good until 2**39-1, well
            // beyond the 2**32-1 limit of the nLockTime field itself.
            let nlocktimebuf = this.stack[this.stack.length - 1]
            let nlocktimebn = BN().fromScriptNumBuffer(nlocktimebuf, fRequireMinimal, 5)
            let nlocktime = nlocktimebn.toNumber()

            // In the rare event that the argument may be < 0 due to
            // some arithmetic being done first, you can always use
            // 0 MAX CHECKLOCKTIMEVERIFY.
            if (nlocktime < 0) {
              this.errstr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME'
              return false
            }

            // Actually compare the specified lock time with the transaction.
            if (!this.checkLockTime(nlocktime)) {
              this.errstr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME'
              return false
            }
          }
          break

        case Opcode.OP_NOP1: case Opcode.OP_NOP3: case Opcode.OP_NOP4: case Opcode.OP_NOP5:
        case Opcode.OP_NOP6: case Opcode.OP_NOP7: case Opcode.OP_NOP8: case Opcode.OP_NOP9: case Opcode.OP_NOP10:
          {
            if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
              this.errstr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS'
              return false
            }
          }
          break

        case Opcode.OP_IF:
        case Opcode.OP_NOTIF:
          {
            // <expression> if [statements] [else [statements]] endif
            // bool fValue = false
            let fValue = false
            if (fExec) {
              if (this.stack.length < 1) {
                this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
                return false
              }
              let buf = this.stack.pop()
              fValue = Interp.castToBool(buf)
              if (opcodenum === Opcode.OP_NOTIF) {
                fValue = !fValue
              }
            }
            this.ifstack.push(fValue)
          }
          break

        case Opcode.OP_ELSE:
          {
            if (this.ifstack.length === 0) {
              this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
              return false
            }
            this.ifstack[this.ifstack.length - 1] = !this.ifstack[this.ifstack.length - 1]
          }
          break

        case Opcode.OP_ENDIF:
          {
            if (this.ifstack.length === 0) {
              this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
              return false
            }
            this.ifstack.pop()
          }
          break

        case Opcode.OP_VERIFY:
          {
            // (true -- ) or
            // (false -- false) and return
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf = this.stack[this.stack.length - 1]
            let fValue = Interp.castToBool(buf)
            if (fValue) {
              this.stack.pop()
            } else {
              this.errstr = 'SCRIPT_ERR_VERIFY'
              return false
            }
          }
          break

        case Opcode.OP_RETURN:
          {
            this.errstr = 'SCRIPT_ERR_OP_RETURN'
            return false
          }
          // unreachable code: break

        //
        // Stack ops
        //
        case Opcode.OP_TOALTSTACK:
          {
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.altstack.push(this.stack.pop())
          }
          break

        case Opcode.OP_FROMALTSTACK:
          {
            if (this.altstack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_ALTSTACK_OPERATION'
              return false
            }
            this.stack.push(this.altstack.pop())
          }
          break

        case Opcode.OP_2DROP:
          {
            // (x1 x2 -- )
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.stack.pop()
            this.stack.pop()
          }
          break

        case Opcode.OP_2DUP:
          {
            // (x1 x2 -- x1 x2 x1 x2)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf1 = this.stack[this.stack.length - 2]
            let buf2 = this.stack[this.stack.length - 1]
            this.stack.push(buf1)
            this.stack.push(buf2)
          }
          break

        case Opcode.OP_3DUP:
          {
            // (x1 x2 x3 -- x1 x2 x3 x1 x2 x3)
            if (this.stack.length < 3) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf1 = this.stack[this.stack.length - 3]
            let buf2 = this.stack[this.stack.length - 2]
            let buf3 = this.stack[this.stack.length - 1]
            this.stack.push(buf1)
            this.stack.push(buf2)
            this.stack.push(buf3)
          }
          break

        case Opcode.OP_2OVER:
          {
            // (x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2)
            if (this.stack.length < 4) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf1 = this.stack[this.stack.length - 4]
            let buf2 = this.stack[this.stack.length - 3]
            this.stack.push(buf1)
            this.stack.push(buf2)
          }
          break

        case Opcode.OP_2ROT:
          {
            // (x1 x2 x3 x4 x5 x6 -- x3 x4 x5 x6 x1 x2)
            if (this.stack.length < 6) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let spliced = this.stack.splice(this.stack.length - 6, 2)
            this.stack.push(spliced[0])
            this.stack.push(spliced[1])
          }
          break

        case Opcode.OP_2SWAP:
          {
            // (x1 x2 x3 x4 -- x3 x4 x1 x2)
            if (this.stack.length < 4) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let spliced = this.stack.splice(this.stack.length - 4, 2)
            this.stack.push(spliced[0])
            this.stack.push(spliced[1])
          }
          break

        case Opcode.OP_IFDUP:
          {
            // (x - 0 | x x)
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf = this.stack[this.stack.length - 1]
            let fValue = Interp.castToBool(buf)
            if (fValue) {
              this.stack.push(buf)
            }
          }
          break

        case Opcode.OP_DEPTH:
          {
            // -- stacksize
            let buf = BN(this.stack.length).toScriptNumBuffer()
            this.stack.push(buf)
          }
          break

        case Opcode.OP_DROP:
          {
            // (x -- )
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.stack.pop()
          }
          break

        case Opcode.OP_DUP:
          {
            // (x -- x x)
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.stack.push(this.stack[this.stack.length - 1])
          }
          break

        case Opcode.OP_NIP:
          {
            // (x1 x2 -- x2)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.stack.splice(this.stack.length - 2, 1)
          }
          break

        case Opcode.OP_OVER:
          {
            // (x1 x2 -- x1 x2 x1)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.stack.push(this.stack[this.stack.length - 2])
          }
          break

        case Opcode.OP_PICK:
        case Opcode.OP_ROLL:
          {
            // (xn ... x2 x1 x0 n - xn ... x2 x1 x0 xn)
            // (xn ... x2 x1 x0 n - ... x2 x1 x0 xn)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf = this.stack[this.stack.length - 1]
            let bn = BN().fromScriptNumBuffer(buf, fRequireMinimal)
            let n = bn.toNumber()
            this.stack.pop()
            if (n < 0 || n >= this.stack.length) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            buf = this.stack[this.stack.length - n - 1]
            if (opcodenum === Opcode.OP_ROLL) {
              this.stack.splice(this.stack.length - n - 1, 1)
            }
            this.stack.push(buf)
          }
          break

        case Opcode.OP_ROT:
          {
            // (x1 x2 x3 -- x2 x3 x1)
            //  x2 x1 x3  after first swap
            //  x2 x3 x1  after second swap
            if (this.stack.length < 3) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let x1 = this.stack[this.stack.length - 3]
            let x2 = this.stack[this.stack.length - 2]
            let x3 = this.stack[this.stack.length - 1]
            this.stack[this.stack.length - 3] = x2
            this.stack[this.stack.length - 2] = x3
            this.stack[this.stack.length - 1] = x1
          }
          break

        case Opcode.OP_SWAP:
          {
            // (x1 x2 -- x2 x1)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let x1 = this.stack[this.stack.length - 2]
            let x2 = this.stack[this.stack.length - 1]
            this.stack[this.stack.length - 2] = x2
            this.stack[this.stack.length - 1] = x1
          }
          break

        case Opcode.OP_TUCK:
          {
            // (x1 x2 -- x2 x1 x2)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            this.stack.splice(this.stack.length - 2, 0, this.stack[this.stack.length - 1])
          }
          break

        case Opcode.OP_SIZE:
          {
            // (in -- in size)
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let bn = BN(this.stack[this.stack.length - 1].length)
            this.stack.push(bn.toScriptNumBuffer())
          }
          break

        //
        // Bitwise logic
        //
        case Opcode.OP_EQUAL:
        case Opcode.OP_EQUALVERIFY:
          // case Opcode.OP_NOTEQUAL: // use Opcode.OP_NUMNOTEQUAL
          {
            // (x1 x2 - bool)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf1 = this.stack[this.stack.length - 2]
            let buf2 = this.stack[this.stack.length - 1]
            let fEqual = cmp(buf1, buf2)
            // Opcode.OP_NOTEQUAL is disabled because it would be too easy to say
            // something like n != 1 and have some wiseguy pass in 1 with extra
            // zero bytes after it (numerically, 0x01 == 0x0001 == 0x000001)
            // if (opcode == Opcode.OP_NOTEQUAL)
            //  fEqual = !fEqual
            this.stack.pop()
            this.stack.pop()
            this.stack.push(fEqual ? Interp.true : Interp.false)
            if (opcodenum === Opcode.OP_EQUALVERIFY) {
              if (fEqual) {
                this.stack.pop()
              } else {
                this.errstr = 'SCRIPT_ERR_EQUALVERIFY'
                return false
              }
            }
          }
          break

        //
        // Numeric
        //
        case Opcode.OP_1ADD:
        case Opcode.OP_1SUB:
        case Opcode.OP_NEGATE:
        case Opcode.OP_ABS:
        case Opcode.OP_NOT:
        case Opcode.OP_0NOTEQUAL:
          {
            // (in -- out)
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf = this.stack[this.stack.length - 1]
            let bn = BN().fromScriptNumBuffer(buf, fRequireMinimal)
            switch (opcodenum) {
              case Opcode.OP_1ADD: bn = bn.add(1)
                break
              case Opcode.OP_1SUB: bn = bn.sub(1)
                break
              case Opcode.OP_NEGATE: bn = bn.neg()
                break
              case Opcode.OP_ABS: if (bn.lt(0)) bn = bn.neg()
                break
              case Opcode.OP_NOT: bn = BN(bn.eq(0) + 0)
                break
              case Opcode.OP_0NOTEQUAL: bn = BN(bn.neq(0) + 0)
                break
            // default:      assert(!"invalid opcode"); break; // TODO: does this ever occur?
            }
            this.stack.pop()
            this.stack.push(bn.toScriptNumBuffer())
          }
          break

        case Opcode.OP_ADD:
        case Opcode.OP_SUB:
        case Opcode.OP_BOOLAND:
        case Opcode.OP_BOOLOR:
        case Opcode.OP_NUMEQUAL:
        case Opcode.OP_NUMEQUALVERIFY:
        case Opcode.OP_NUMNOTEQUAL:
        case Opcode.OP_LESSTHAN:
        case Opcode.OP_GREATERTHAN:
        case Opcode.OP_LESSTHANOREQUAL:
        case Opcode.OP_GREATERTHANOREQUAL:
        case Opcode.OP_MIN:
        case Opcode.OP_MAX:
          {
            // (x1 x2 -- out)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let bn1 = BN().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal)
            let bn2 = BN().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal)
            let bn = BN(0)

            switch (opcodenum) {
              case Opcode.OP_ADD:
                bn = bn1.add(bn2)
                break

              case Opcode.OP_SUB:
                bn = bn1.sub(bn2)
                break

              // case Opcode.OP_BOOLAND:       bn = (bn1 != bnZero && bn2 != bnZero); break
              case Opcode.OP_BOOLAND: bn = BN((bn1.neq(0) && bn2.neq(0)) + 0)
                break
              // case Opcode.OP_BOOLOR:        bn = (bn1 != bnZero || bn2 != bnZero); break
              case Opcode.OP_BOOLOR: bn = BN((bn1.neq(0) || bn2.neq(0)) + 0)
                break
              // case Opcode.OP_NUMEQUAL:      bn = (bn1 == bn2); break
              case Opcode.OP_NUMEQUAL: bn = BN(bn1.eq(bn2) + 0)
                break
              // case Opcode.OP_NUMEQUALVERIFY:    bn = (bn1 == bn2); break
              case Opcode.OP_NUMEQUALVERIFY: bn = BN(bn1.eq(bn2) + 0)
                break
              // case Opcode.OP_NUMNOTEQUAL:     bn = (bn1 != bn2); break
              case Opcode.OP_NUMNOTEQUAL: bn = BN(bn1.neq(bn2) + 0)
                break
              // case Opcode.OP_LESSTHAN:      bn = (bn1 < bn2); break
              case Opcode.OP_LESSTHAN: bn = BN(bn1.lt(bn2) + 0)
                break
              // case Opcode.OP_GREATERTHAN:     bn = (bn1 > bn2); break
              case Opcode.OP_GREATERTHAN: bn = BN(bn1.gt(bn2) + 0)
                break
              // case Opcode.OP_LESSTHANOREQUAL:   bn = (bn1 <= bn2); break
              case Opcode.OP_LESSTHANOREQUAL: bn = BN(bn1.leq(bn2) + 0)
                break
              // case Opcode.OP_GREATERTHANOREQUAL:  bn = (bn1 >= bn2); break
              case Opcode.OP_GREATERTHANOREQUAL: bn = BN(bn1.geq(bn2) + 0)
                break
              case Opcode.OP_MIN: bn = (bn1.lt(bn2) ? bn1 : bn2)
                break
              case Opcode.OP_MAX: bn = (bn1.gt(bn2) ? bn1 : bn2)
                break
            // default:           assert(!"invalid opcode"); break; //TODO: does this ever occur?
            }
            this.stack.pop()
            this.stack.pop()
            this.stack.push(bn.toScriptNumBuffer())

            if (opcodenum === Opcode.OP_NUMEQUALVERIFY) {
              // if (CastToBool(stacktop(-1)))
              if (Interp.castToBool(this.stack[this.stack.length - 1])) {
                this.stack.pop()
              } else {
                this.errstr = 'SCRIPT_ERR_NUMEQUALVERIFY'
                return false
              }
            }
          }
          break

        case Opcode.OP_WITHIN:
          {
            // (x min max -- out)
            if (this.stack.length < 3) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let bn1 = BN().fromScriptNumBuffer(this.stack[this.stack.length - 3], fRequireMinimal)
            let bn2 = BN().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal)
            let bn3 = BN().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal)
            // bool fValue = (bn2 <= bn1 && bn1 < bn3)
            let fValue = bn2.leq(bn1) && bn1.lt(bn3)
            this.stack.pop()
            this.stack.pop()
            this.stack.pop()
            this.stack.push(fValue ? Interp.true : Interp.false)
          }
          break

        //
        // Crypto
        //
        case Opcode.OP_RIPEMD160:
        case Opcode.OP_SHA1:
        case Opcode.OP_SHA256:
        case Opcode.OP_HASH160:
        case Opcode.OP_HASH256:
          {
            // (in -- hash)
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            let buf = this.stack[this.stack.length - 1]
            // valtype vchHash((opcode == Opcode.OP_RIPEMD160 || opcode == Opcode.OP_SHA1 || opcode == Opcode.OP_HASH160) ? 20 : 32)
            let bufHash
            if (opcodenum === Opcode.OP_RIPEMD160) {
              bufHash = Hash.ripemd160(buf)
            } else if (opcodenum === Opcode.OP_SHA1) {
              bufHash = Hash.sha1(buf)
            } else if (opcodenum === Opcode.OP_SHA256) {
              bufHash = Hash.sha256(buf)
            } else if (opcodenum === Opcode.OP_HASH160) {
              bufHash = Hash.sha256ripemd160(buf)
            } else if (opcodenum === Opcode.OP_HASH256) {
              bufHash = Hash.sha256sha256(buf)
            }
            this.stack.pop()
            this.stack.push(bufHash)
          }
          break

        case Opcode.OP_CODESEPARATOR:
          {
            // Hash starts after the code separator
            this.pbegincodehash = this.pc
          }
          break

        case Opcode.OP_CHECKSIG:
        case Opcode.OP_CHECKSIGVERIFY:
          {
            // (sig pubkey -- bool)
            if (this.stack.length < 2) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }

            let bufSig = this.stack[this.stack.length - 2]
            let bufPubkey = this.stack[this.stack.length - 1]

            // Subset of script starting at the most recent codeseparator
            // CScript scriptCode(pbegincodehash, pend)
            let subscript = Script().fromObject({chunks: this.script.chunks.slice(this.pbegincodehash)})

            // Drop the signature, since there's no way for a signature to sign itself
            subscript.findAndDelete(Script().writeBuffer(bufSig))

            if (!this.checkSigEncoding(bufSig) || !this.checkPubkeyEncoding(bufPubkey)) {
              // serror is set
              return false
            }

            let fSuccess
            try {
              let sig = Sig().fromTxFormat(bufSig)
              let pubkey = Pubkey().fromBuffer(bufPubkey, false)
              fSuccess = this.tx.verify(sig, pubkey, this.nin, subscript)
            } catch (e) {
              // invalid sig or pubkey
              fSuccess = false
            }

            this.stack.pop()
            this.stack.pop()
            // stack.push_back(fSuccess ? vchTrue : vchFalse)
            this.stack.push(fSuccess ? Interp.true : Interp.false)
            if (opcodenum === Opcode.OP_CHECKSIGVERIFY) {
              if (fSuccess) {
                this.stack.pop()
              } else {
                this.errstr = 'SCRIPT_ERR_CHECKSIGVERIFY'
                return false
              }
            }
          }
          break

        case Opcode.OP_CHECKMULTISIG:
        case Opcode.OP_CHECKMULTISIGVERIFY:
          {
            // ([sig ...] num_of_signatures [pubkey ...] num_of_pubkeys -- bool)

            let i = 1
            if (this.stack.length < i) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }

            let nKeysCount = BN().fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber()
            if (nKeysCount < 0 || nKeysCount > 20) {
              this.errstr = 'SCRIPT_ERR_PUBKEY_COUNT'
              return false
            }
            this.nOpCount += nKeysCount
            if (this.nOpCount > 201) {
              this.errstr = 'SCRIPT_ERR_OP_COUNT'
              return false
            }
            // int ikey = ++i
            let ikey = ++i
            i += nKeysCount
            if (this.stack.length < i) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }

            let nSigsCount = BN().fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber()
            if (nSigsCount < 0 || nSigsCount > nKeysCount) {
              this.errstr = 'SCRIPT_ERR_SIG_COUNT'
              return false
            }
            // int isig = ++i
            let isig = ++i
            i += nSigsCount
            if (this.stack.length < i) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }

            // Subset of script starting at the most recent codeseparator
            let subscript = Script().fromObject({chunks: this.script.chunks.slice(this.pbegincodehash)})

            // Drop the signatures, since there's no way for a signature to sign itself
            for (let k = 0; k < nSigsCount; k++) {
              let bufSig = this.stack[this.stack.length - isig - k]
              subscript.findAndDelete(Script().writeBuffer(bufSig))
            }

            let fSuccess = true
            while (fSuccess && nSigsCount > 0) {
              // valtype& vchSig  = stacktop(-isig)
              let bufSig = this.stack[this.stack.length - isig]
              // valtype& vchPubKey = stacktop(-ikey)
              let bufPubkey = this.stack[this.stack.length - ikey]

              if (!this.checkSigEncoding(bufSig) || !this.checkPubkeyEncoding(bufPubkey)) {
                // serror is set
                return false
              }

              let fOk
              try {
                let sig = Sig().fromTxFormat(bufSig)
                let pubkey = Pubkey().fromBuffer(bufPubkey, false)
                fOk = this.tx.verify(sig, pubkey, this.nin, subscript)
              } catch (e) {
                // invalid sig or pubkey
                fOk = false
              }

              if (fOk) {
                isig++
                nSigsCount--
              }
              ikey++
              nKeysCount--

              // If there are more signatures left than keys left,
              // then too many signatures have failed
              if (nSigsCount > nKeysCount) {
                fSuccess = false
              }
            }

            // Clean up stack of actual arguments
            while (i-- > 1) {
              this.stack.pop()
            }

            // A bug causes CHECKMULTISIG to consume one extra argument
            // whose contents were not checked in any way.
            //
            // Unfortunately this is a potential source of mutability,
            // so optionally verify it is exactly equal to zero prior
            // to removing it from the stack.
            if (this.stack.length < 1) {
              this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
              return false
            }
            if ((this.flags & Interp.SCRIPT_VERIFY_NULLDUMMY) && this.stack[this.stack.length - 1].length) {
              this.errstr = 'SCRIPT_ERR_SIG_NULLDUMMY'
              return false
            }
            this.stack.pop()

            // stack.push_back(fSuccess ? vchTrue : vchFalse)
            this.stack.push(fSuccess ? Interp.true : Interp.false)

            if (opcodenum === Opcode.OP_CHECKMULTISIGVERIFY) {
              if (fSuccess) {
                this.stack.pop()
              } else {
                this.errstr = 'SCRIPT_ERR_CHECKMULTISIGVERIFY'
                return false
              }
            }
          }
          break

        default:
          this.errstr = 'SCRIPT_ERR_BAD_OPCODE'
          return false
      }
    }

    return true
  }

  /**
   * This function has the same interface as bitcoin core's VerifyScript and is
   * the function you want to use to know if a particular input in a
   * transaction is valid or not. It simply iterates over the results generated
   * by the results method.
   */
  Interp.prototype.verify = function (scriptSig, scriptPubkey, tx, nin, flags) {
    let results = this.results(scriptSig, scriptPubkey, tx, nin, flags)
    for (let success of results) {
      if (!success) {
        return false
      }
    }
    return true
  }

  /**
   * Gives you the results of the execution each operation of the scripSig and
   * scriptPubkey corresponding to a particular input (nin) for the concerned
   * transaction (tx). Each result can be either true or false. If true, then
   * the operation did not invalidate the transaction. If false, then the
   * operation has invalidated the script, and the transaction is not valid.
   * flags is a number that can pass in some special flags, such as whether or
   * not to execute the redeemScript in a p2sh transaction.
   *
   * This method is translated from bitcoin core's VerifyScript.  This function
   * is a generator, thus you can and need to iterate through it.  To
   * automatically return true or false, use the verify method.
   */
  Interp.prototype.results = function *(scriptSig, scriptPubkey, tx, nin, flags) {
    let stackCopy

    this.fromObject({
      script: scriptSig,
      tx: tx,
      nin: nin,
      flags: flags
    })

    if ((flags & Interp.SCRIPT_VERIFY_SIGPUSHONLY) !== 0 && !scriptSig.isPushOnly()) {
      this.errstr = 'SCRIPT_ERR_SIG_PUSHONLY'
      yield false
    }

    yield * this.eval()

    if (flags & Interp.SCRIPT_VERIFY_P2SH) {
      stackCopy = this.stack.slice()
    }

    let stack = this.stack
    this.initialize()
    this.fromObject({
      script: scriptPubkey,
      stack: stack,
      tx: tx,
      nin: nin,
      flags: flags
    })

    yield * this.eval()

    if (this.stack.length === 0) {
      this.errstr = 'SCRIPT_ERR_EVAL_FALSE'
      yield false
    }

    let buf = this.stack[this.stack.length - 1]
    if (!Interp.castToBool(buf)) {
      this.errstr = 'SCRIPT_ERR_EVAL_FALSE'
      yield false
    }

    // Additional validation for spend-to-script-hash transactions:
    if ((flags & Interp.SCRIPT_VERIFY_P2SH) && scriptPubkey.isScripthashOut()) {
      // scriptSig must be literals-only or validation fails
      if (!scriptSig.isPushOnly()) {
        this.errstr = 'SCRIPT_ERR_SIG_PUSHONLY'
        yield false
      }

      // Restore stack.
      let tmp = stack
      stack = stackCopy
      stackCopy = tmp

      // stack cannot be empty here, because if it was the
      // P2SH  HASH <> EQUAL  scriptPubKey would be evaluated with
      // an empty stack and the EvalScript above would yield false.
      if (stack.length === 0) {
        throw new Error('internal error - stack copy empty')
      }

      let pubkeySerialized = stack[stack.length - 1]
      let scriptPubkey2 = Script().fromBuffer(pubkeySerialized)
      stack.pop()

      this.initialize()
      this.fromObject({
        script: scriptPubkey2,
        stack: stack,
        tx: tx,
        nin: nin,
        flags: flags
      })

      yield * this.eval()

      if (stack.length === 0) {
        this.errstr = 'SCRIPT_ERR_EVAL_FALSE'
        yield false
      }

      if (!Interp.castToBool(stack[stack.length - 1])) {
        this.errstr = 'SCRIPT_ERR_EVAL_FALSE'
        yield false
      } else {
        yield true
      }
    }

    // The CLEANSTACK check is only performed after potential P2SH evaluation,
    // as the non-P2SH evaluation of a P2SH script will obviously not result in
    // a clean stack (the P2SH inputs remain).
    if ((flags & Interp.SCRIPT_VERIFY_CLEANSTACK) !== 0) {
      // Disallow CLEANSTACK without P2SH, as otherwise a switch
      // CLEANSTACK->P2SH+CLEANSTACK would be possible, which is not a softfork
      // (and P2SH should be one).
      if (!(flags & Interp.SCRIPT_VERIFY_P2SH)) {
        throw new Error('cannot use CLEANSTACK without P2SH')
      }
      if (stack.length !== 1) {
        this.errstr = 'SCRIPT_ERR_CLEANSTACK'
        yield false
      }
    }

    yield true
  }

  return Interp
}

inject = require('./injector')(inject, dependencies)
let Interp = inject()
module.exports = Interp
