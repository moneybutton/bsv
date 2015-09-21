/*
 * Script
 * ======
 *
 * Script is the scripting language built into bitcoin. The Script class lets
 * you create an instance of a script, e.g. for a scriptSig or a scriptPubkey.
 * It understands both the binary format, as well as two different string
 * formats. The default string format, to/fromString, is a custom format only
 * used by fullnode because it is isomorphic to the binary format (or as
 * isomorphic as it can be ... since OP_0 and OP_FALSE have the same byte
 * value, and so do OP_1 and OP_TRUE). The bitcoind string format is also
 * support, but that format is not isomorphic (i.e., if you pull in a string
 * and then write it again, you are likely to get back a different string, even
 * if you don't use OP_0, OP_FALSE, OP_1, or OP_TRUE).
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  BR: require('./br'),
  BW: require('./bw'),
  cmp: require('./cmp'),
  Opcode: require('./opcode'),
  Struct: require('./struct')
}

function inject (deps) {
  let BN = deps.BN
  let BR = deps.BR
  let BW = deps.BW
  let cmp = deps.cmp
  let Opcode = deps.Opcode
  let Struct = deps.Struct

  let Script = function Script (chunks) {
    if (!(this instanceof Script)) {
      return new Script(chunks)
    }
    this.chunks = []
    this.fromObject({
      chunks: chunks
    })
  }

  Script.prototype = Object.create(Struct.prototype)
  Script.prototype.constructor = Script

  Script.prototype.fromJSON = function (json) {
    return this.fromString(json)
  }

  Script.prototype.toJSON = function () {
    return this.toString()
  }

  Script.prototype.fromBuffer = function (buf) {
    this.chunks = []

    let br = new BR(buf)
    while (!br.eof()) {
      let opcodenum = br.readUInt8()

      let len, buf
      if (opcodenum > 0 && opcodenum < Opcode.OP_PUSHDATA1) {
        len = opcodenum
        this.chunks.push({
          buf: br.read(len),
          len: len,
          opcodenum: opcodenum
        })
      } else if (opcodenum === Opcode.OP_PUSHDATA1) {
        len = br.readUInt8()
        let buf = br.read(len)
        this.chunks.push({
          buf: buf,
          len: len,
          opcodenum: opcodenum
        })
      } else if (opcodenum === Opcode.OP_PUSHDATA2) {
        len = br.readUInt16LE()
        buf = br.read(len)
        this.chunks.push({
          buf: buf,
          len: len,
          opcodenum: opcodenum
        })
      } else if (opcodenum === Opcode.OP_PUSHDATA4) {
        len = br.readUInt32LE()
        buf = br.read(len)
        this.chunks.push({
          buf: buf,
          len: len,
          opcodenum: opcodenum
        })
      } else {
        this.chunks.push({
          opcodenum: opcodenum
        })
      }
    }

    return this
  }

  Script.prototype.toBuffer = function () {
    let bw = new BW()

    for (let i = 0; i < this.chunks.length; i++) {
      let chunk = this.chunks[i]
      let opcodenum = chunk.opcodenum
      bw.writeUInt8(opcodenum)
      if (chunk.buf) {
        if (opcodenum < Opcode.OP_PUSHDATA1) {
          bw.write(chunk.buf)
        }
        else if (opcodenum === Opcode.OP_PUSHDATA1) {
          bw.writeUInt8(chunk.len)
          bw.write(chunk.buf)
        }
        else if (opcodenum === Opcode.OP_PUSHDATA2) {
          bw.writeUInt16LE(chunk.len)
          bw.write(chunk.buf)
        }
        else if (opcodenum === Opcode.OP_PUSHDATA4) {
          bw.writeUInt32LE(chunk.len)
          bw.write(chunk.buf)
        }
      }
    }

    return bw.toBuffer()
  }

  Script.prototype.fromString = function (str) {
    this.chunks = []
    if (str === '' || str === undefined)
      return this

    let tokens = str.split(' ')
    let i = 0
    while (i < tokens.length) {
      let token = tokens[i]
      let opcode = Opcode(token)
      let opcodenum = opcode.toNumber()

      if (opcodenum === undefined) {
        opcodenum = parseInt(token)
        if (opcodenum > 0 && opcodenum < Opcode.OP_PUSHDATA1) {
          this.chunks.push({
            buf: new Buffer(tokens[i + 1].slice(2), 'hex'),
            len: opcodenum,
            opcodenum: opcodenum
          })
          i = i + 2
        } else if (opcodenum === 0) {
          this.chunks.push({
            opcodenum: 0
          })
          i = i + 1
        } else {
          throw new Error('Invalid script')
        }
      } else if (opcodenum === Opcode.OP_PUSHDATA1 || opcodenum === Opcode.OP_PUSHDATA2 || opcodenum === Opcode.OP_PUSHDATA4) {
        if (tokens[i + 2].slice(0, 2) != '0x')
          throw new Error('Pushdata data must start with 0x')
        this.chunks.push({
          buf: new Buffer(tokens[i + 2].slice(2), 'hex'),
          len: parseInt(tokens[i + 1]),
          opcodenum: opcodenum
        })
        i = i + 3
      } else {
        this.chunks.push({
          opcodenum: opcodenum
        })
        i = i + 1
      }
    }
    return this
  }

  Script.prototype.toString = function () {
    let str = ''

    for (let i = 0; i < this.chunks.length; i++) {
      let chunk = this.chunks[i]
      let opcodenum = chunk.opcodenum
      if (!chunk.buf) {
        if (Opcode.str[opcodenum] !== undefined)
          str = str + ' ' + Opcode(opcodenum).toString()
        else
          str = str + ' ' + '0x' + opcodenum.toString(16)
      } else {
        if (opcodenum === Opcode.OP_PUSHDATA1 || opcodenum === Opcode.OP_PUSHDATA2 || opcodenum === Opcode.OP_PUSHDATA4)
          str = str + ' ' + Opcode(opcodenum).toString()
        str = str + ' ' + chunk.len
        str = str + ' ' + '0x' + chunk.buf.toString('hex')
      }
    }

    return str.substr(1)
  }

  /**
   * Input the script from the script string format used in bitcoind data tests
   */
  Script.prototype.fromBitcoindString = function (str) {
    let bw = new BW()
    let tokens = str.split(' ')
    let i
    for (i = 0; i < tokens.length; i++) {
      let token = tokens[i]
      if (token === '')
        continue
      if (token[0] === '0' && token[1] === 'x') {
        let hex = token.slice(2)
        bw.write(new Buffer(hex, 'hex'))
      } else if (token[0] === "'") {
        let tstr = token.slice(1, token.length - 1)
        let cbuf = new Buffer(tstr)
        let tbuf = Script().writeBuffer(cbuf).toBuffer()
        bw.write(tbuf)
      } else if (Opcode['OP_' + token] !== undefined) {
        let opstr = 'OP_' + token
        let opcodenum = Opcode[opstr]
        bw.writeUInt8(opcodenum)
      } else if (typeof Opcode[token] === 'number') {
        let opstr = token
        let opcodenum = Opcode[opstr]
        bw.writeUInt8(opcodenum)
      } else if (!isNaN(parseInt(token))) {
        let bn = BN(token)
        let script = Script().writeBN(bn)
        let tbuf = script.toBuffer()
        bw.write(tbuf)
      } else {
        throw new Error('Could not determine type of script value')
      }
    }
    let buf = bw.toBuffer()
    return this.fromBuffer(buf)
  }

  /**
   * Output the script to the script string format used in bitcoind data tests.
   */
  Script.prototype.toBitcoindString = function () {
    let str = ''
    for (let i = 0; i < this.chunks.length; i++) {
      let chunk = this.chunks[i]
      if (chunk.buf) {
        let buf = Script([chunk]).toBuffer()
        let hex = buf.toString('hex')
        str = str + ' ' + '0x' + hex
      } else if (Opcode.str[chunk.opcodenum] !== undefined) {
        let ostr = Opcode(chunk.opcodenum).toString()
        str = str + ' ' + ostr.slice(3) // remove OP_
      } else {
        str = str + ' ' + '0x' + chunk.opcodenum.toString(16)
      }
    }
    return str.substr(1)
  }

  /**
   * Turn script into a standard pubkeyhash output script
   */
  Script.prototype.fromPubkeyhash = function (hashbuf) {
    if (hashbuf.length !== 20)
      throw new Error('hashbuf must be a 20 byte buffer')
    this.writeOpcode(Opcode.OP_DUP)
    this.writeOpcode(Opcode.OP_HASH160)
    this.writeBuffer(hashbuf)
    this.writeOpcode(Opcode.OP_EQUALVERIFY)
    this.writeOpcode(Opcode.OP_CHECKSIG)
    return this
  }

  /**
   * Turn script into a standard scripthash (p2sh) output script
   */
  Script.prototype.fromScripthash = function (hashbuf) {
    if (hashbuf.length !== 20)
      throw new Error('hashbuf must be a 20 byte buffer')
    this.writeOpcode(Opcode.OP_HASH160)
    this.writeBuffer(hashbuf)
    this.writeOpcode(Opcode.OP_EQUAL)
    return this
  }

  Script.prototype.removeCodeseparators = function () {
    let chunks = []
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.chunks[i].opcodenum !== Opcode.OP_CODESEPARATOR) {
        chunks.push(this.chunks[i])
      }
    }
    this.chunks = chunks
    return this
  }

  Script.prototype.isPushOnly = function () {
    for (let i = 0; i < this.chunks.length; i++) {
      let chunk = this.chunks[i]
      let opcodenum = chunk.opcodenum
      if (opcodenum > Opcode.OP_16)
        return false
    }
    return true
  }

  Script.prototype.isOpReturn = function () {
    if (this.chunks[0].opcodenum === Opcode.OP_RETURN
      &&
      (this.chunks.length === 1
      ||
      (this.chunks.length === 2
      && this.chunks[1].buf
      && this.chunks[1].buf.length <= 40
      && this.chunks[1].length === this.chunks.len))) {
      return true
    } else {
      return false
    }
  }

  Script.prototype.isPubkeyhashOut = function () {
    if (this.chunks[0] && this.chunks[0].opcodenum === Opcode.OP_DUP
      && this.chunks[1] && this.chunks[1].opcodenum === Opcode.OP_HASH160
      && this.chunks[2].buf
      && this.chunks[3] && this.chunks[3].opcodenum === Opcode.OP_EQUALVERIFY
      && this.chunks[4] && this.chunks[4].opcodenum === Opcode.OP_CHECKSIG) {
      return true
    } else {
      return false
    }
  }

  /**
   * A pubkeyhash input should consist of two push operations. The first push
   * operation may be OP_0, which means the signature is missing, which is true
   * for some partially signed (and invalid) transactions.
   */
  Script.prototype.isPubkeyhashIn = function () {
    if (this.chunks.length === 2
      && (this.chunks[0].buf || this.chunks[0].opcodenum === Opcode.OP_0)
      && this.chunks[1].buf) {
      return true
    } else {
      return false
    }
  }

  Script.prototype.isScripthashOut = function () {
    let buf = this.toBuffer()
    return (buf.length === 23 &&
    buf[0] === Opcode.OP_HASH160 &&
    buf[1] === 0x14 &&
    buf[22] === Opcode.OP_EQUAL)
  }

  /**
   * Note that these are frequently indistinguishable from pubkeyhashin
   */
  Script.prototype.isScripthashIn = function () {
    let allpush = this.chunks.every(function (chunk) {
      return Buffer.isBuffer(chunk.buf)
    })
    if (allpush) {
      return true
    } else {
      return false
    }
  }

  /**
   * Analagous to bitcoind's FindAndDelete. Find and delete equivalent chunks,
   * typically used with push data chunks.  Note that this will find and delete
   * not just the same data, but the same data with the same push data op as
   * produced by default. i.e., if a pushdata in a tx does not use the minimal
   * pushdata op, then when you try to remove the data it is pushing, it will not
   * be removed, because they do not use the same pushdata op.
   */
  Script.prototype.findAndDelete = function (script) {
    let buf = script.toBuffer()
    for (let i = 0; i < this.chunks.length; i++) {
      let script2 = Script([this.chunks[i]])
      let buf2 = script2.toBuffer()
      if (cmp(buf, buf2))
        this.chunks.splice(i, 1)
    }
    return this
  }

  Script.prototype.writeScript = function (script) {
    this.chunks = this.chunks.concat(script.chunks)
    return this
  }

  Script.prototype.writeString = function (str) {
    let script = Script().fromString(str)
    this.chunks = this.chunks.concat(script.chunks)
    return this
  }

  Script.prototype.writeOpcode = function (opcodenum) {
    this.chunks.push({opcodenum: opcodenum})
    return this
  }

  // write a big number in the minimal way
  Script.prototype.writeBN = function (bn) {
    let opcodenum
    if (bn.cmp(0) === Opcode.OP_0) {
      this.chunks.push({
        opcodenum: Opcode.OP_0
      })
    } else if (bn.cmp(-1) === 0) {
      this.chunks.push({
        opcodenum: Opcode.OP_1NEGATE
      })
    } else if (bn.cmp(1) >= 0 && bn.cmp(16) <= 0) { // see OP_1 - OP_16
      this.chunks.push({
        opcodenum: bn.toNumber() + Opcode.OP_1 - 1
      })
    } else {
      let buf = bn.toSM({endian: 'little'})
      this.writeBuffer(buf)
    }
    return this
  }

  // note: this does not necessarily write buffers in the minimal way
  // to write numbers in the minimal way, see writeBN
  Script.prototype.writeBuffer = function (buf) {
    let opcodenum
    let len = buf.length
    if (buf.length > 0 && buf.length < Opcode.OP_PUSHDATA1) {
      opcodenum = buf.length
    } else if (buf.length === 0) {
      opcodenum = Opcode.OP_0
    } else if (buf.length < Math.pow(2, 8)) {
      opcodenum = Opcode.OP_PUSHDATA1
    } else if (buf.length < Math.pow(2, 16)) {
      opcodenum = Opcode.OP_PUSHDATA2
    } else if (buf.length < Math.pow(2, 32)) {
      opcodenum = Opcode.OP_PUSHDATA4
    } else {
      throw new Error("You can't push that much data")
    }
    this.chunks.push({
      buf: buf,
      len: len,
      opcodenum: opcodenum
    })
    return this
  }

  // make sure a push is the smallest way to push that particular data
  // comes from bitcoind's script interpreter CheckMinimalPush function
  Script.prototype.checkMinimalPush = function (i) {
    let chunk = this.chunks[i]
    let buf = chunk.buf
    let opcodenum = chunk.opcodenum
    if (!buf) {
      return true
    }
    if (buf.length == 0) {
      // Could have used OP_0.
      return opcodenum == Opcode.OP_0
    } else if (buf.length == 1 && buf[0] >= 1 && buf[0] <= 16) {
      // Could have used OP_1 .. OP_16.
      return opcodenum == Opcode.OP_1 + (buf[0] - 1)
    } else if (buf.length == 1 && buf[0] == 0x81) {
      // Could have used OP_1NEGATE.
      return opcodenum == Opcode.OP_1NEGATE
    } else if (buf.length <= 75) {
      // Could have used a direct push (opcode indicating number of bytes pushed + those bytes).
      return opcodenum == buf.length
    } else if (buf.length <= 255) {
      // Could have used OP_PUSHDATA.
      return opcodenum == Opcode.OP_PUSHDATA1
    } else if (buf.length <= 65535) {
      // Could have used OP_PUSHDATA2.
      return opcodenum == Opcode.OP_PUSHDATA2
    }
    return true
  }

  return Script
}

inject = require('./injector')(inject, dependencies)
let Script = inject()
module.exports = Script
