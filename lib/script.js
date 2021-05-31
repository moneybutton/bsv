/*
 * Script
 * ======
 *
 * Script is the scripting language built into bitcoin. The Script class lets
 * you create an instance of a script, e.g. for a scriptSig or a scriptPubKey.
 * It understands both the binary format, as well as two different string
 * formats. The default string format, to/fromString, is a custom format only
 * used by Yours Bitcoin because it is isomorphic to the binary format (or as
 * isomorphic as it can be ... since OP_0 and OP_FALSE have the same byte
 * value, and so do OP_1 and OP_TRUE). The bitcoind string format is also
 * support, but that format is not isomorphic (i.e., if you pull in a string
 * and then write it again, you are likely to get back a different string, even
 * if you don't use OP_0, OP_FALSE, OP_1, or OP_TRUE).
 */
'use strict'

import { Bn } from './bn'
import { Br } from './br'
import { Bw } from './bw'
import { cmp } from './cmp'
import { OpCode } from './op-code'
import { PubKey } from './pub-key'
import { Sig } from './sig'
import { Struct } from './struct'

class Script extends Struct {
  constructor (chunks = []) {
    super({ chunks })
  }

  fromJSON (json) {
    return this.fromString(json)
  }

  toJSON () {
    return this.toString()
  }

  fromBuffer (buf) {
    this.chunks = []

    const br = new Br(buf)
    while (!br.eof()) {
      const opCodeNum = br.readUInt8()

      let len = 0
      let buf = Buffer.from([])
      if (opCodeNum > 0 && opCodeNum < OpCode.OP_PUSHDATA1) {
        len = opCodeNum
        this.chunks.push({
          buf: br.read(len),
          len: len,
          opCodeNum: opCodeNum
        })
      } else if (opCodeNum === OpCode.OP_PUSHDATA1) {
        try {
          len = br.readUInt8()
          buf = br.read(len)
        } catch (err) {
          br.read()
        }
        this.chunks.push({
          buf: buf,
          len: len,
          opCodeNum: opCodeNum
        })
      } else if (opCodeNum === OpCode.OP_PUSHDATA2) {
        try {
          len = br.readUInt16LE()
          buf = br.read(len)
        } catch (err) {
          br.read()
        }
        this.chunks.push({
          buf: buf,
          len: len,
          opCodeNum: opCodeNum
        })
      } else if (opCodeNum === OpCode.OP_PUSHDATA4) {
        try {
          len = br.readUInt32LE()
          buf = br.read(len)
        } catch (err) {
          br.read()
        }
        this.chunks.push({
          buf: buf,
          len: len,
          opCodeNum: opCodeNum
        })
      } else {
        this.chunks.push({
          opCodeNum: opCodeNum
        })
      }
    }

    return this
  }

  toBuffer () {
    const bw = new Bw()

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const opCodeNum = chunk.opCodeNum
      bw.writeUInt8(opCodeNum)
      if (chunk.buf) {
        if (opCodeNum < OpCode.OP_PUSHDATA1) {
          bw.write(chunk.buf)
        } else if (opCodeNum === OpCode.OP_PUSHDATA1) {
          bw.writeUInt8(chunk.len)
          bw.write(chunk.buf)
        } else if (opCodeNum === OpCode.OP_PUSHDATA2) {
          bw.writeUInt16LE(chunk.len)
          bw.write(chunk.buf)
        } else if (opCodeNum === OpCode.OP_PUSHDATA4) {
          bw.writeUInt32LE(chunk.len)
          bw.write(chunk.buf)
        }
      }
    }

    return bw.toBuffer()
  }

  fromString (str) {
    this.chunks = []
    if (str === '' || str === undefined) {
      return this
    }

    const tokens = str.split(' ')
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      let opCodeNum
      try {
        const opCode = new OpCode().fromString(token)
        opCodeNum = opCode.toNumber()
      } catch (err) {}

      if (opCodeNum === undefined) {
        opCodeNum = parseInt(token, 10)
        if (opCodeNum > 0 && opCodeNum < OpCode.OP_PUSHDATA1) {
          this.chunks.push({
            buf: Buffer.from(tokens[i + 1].slice(2), 'hex'),
            len: opCodeNum,
            opCodeNum: opCodeNum
          })
          i = i + 2
        } else if (opCodeNum === 0) {
          this.chunks.push({
            opCodeNum: 0
          })
          i = i + 1
        } else {
          throw new Error('Invalid script')
        }
      } else if (
        opCodeNum === OpCode.OP_PUSHDATA1 ||
          opCodeNum === OpCode.OP_PUSHDATA2 ||
          opCodeNum === OpCode.OP_PUSHDATA4
      ) {
        if (tokens[i + 2].slice(0, 2) !== '0x') {
          throw new Error('Pushdata data must start with 0x')
        }
        this.chunks.push({
          buf: Buffer.from(tokens[i + 2].slice(2), 'hex'),
          len: parseInt(tokens[i + 1], 10),
          opCodeNum: opCodeNum
        })
        i = i + 3
      } else {
        this.chunks.push({
          opCodeNum: opCodeNum
        })
        i = i + 1
      }
    }
    return this
  }

  toString () {
    let str = ''

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const opCodeNum = chunk.opCodeNum
      if (!chunk.buf) {
        if (OpCode.str[opCodeNum] !== undefined) {
          str = str + ' ' + new OpCode(opCodeNum).toString()
        } else {
          str = str + ' ' + '0x' + opCodeNum.toString(16)
        }
      } else {
        if (
          opCodeNum === OpCode.OP_PUSHDATA1 ||
            opCodeNum === OpCode.OP_PUSHDATA2 ||
            opCodeNum === OpCode.OP_PUSHDATA4
        ) {
          str = str + ' ' + new OpCode(opCodeNum).toString()
        }
        str = str + ' ' + chunk.len
        str = str + ' ' + '0x' + chunk.buf.toString('hex')
      }
    }

    return str.substr(1)
  }

  /**
     * Input the script from the script string format used in bitcoind data tests
     */
  fromBitcoindString (str) {
    const bw = new Bw()
    const tokens = str.split(' ')
    let i
    for (i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token === '') {
        continue
      }
      if (token[0] === '0' && token[1] === 'x') {
        const hex = token.slice(2)
        bw.write(Buffer.from(hex, 'hex'))
      } else if (token[0] === "'") {
        const tstr = token.slice(1, token.length - 1)
        const cbuf = Buffer.from(tstr)
        const tbuf = new Script().writeBuffer(cbuf).toBuffer()
        bw.write(tbuf)
      } else if (OpCode['OP_' + token] !== undefined) {
        const opstr = 'OP_' + token
        const opCodeNum = OpCode[opstr]
        bw.writeUInt8(opCodeNum)
      } else if (typeof OpCode[token] === 'number') {
        const opstr = token
        const opCodeNum = OpCode[opstr]
        bw.writeUInt8(opCodeNum)
      } else if (!isNaN(parseInt(token, 10))) {
        const bn = new Bn(token)
        const script = new Script().writeBn(bn)
        const tbuf = script.toBuffer()
        bw.write(tbuf)
      } else {
        throw new Error('Could not determine type of script value')
      }
    }
    const buf = bw.toBuffer()
    return this.fromBuffer(buf)
  }

  static fromBitcoindString (str) {
    return new this().fromBitcoindString(str)
  }

  /**
     * Output the script to the script string format used in bitcoind data tests.
     */
  toBitcoindString () {
    let str = ''
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      if (chunk.buf) {
        const buf = new Script([chunk]).toBuffer()
        const hex = buf.toString('hex')
        str = str + ' ' + '0x' + hex
      } else if (OpCode.str[chunk.opCodeNum] !== undefined) {
        const ostr = new OpCode(chunk.opCodeNum).toString()
        str = str + ' ' + ostr.slice(3) // remove OP_
      } else {
        str = str + ' ' + '0x' + chunk.opCodeNum.toString(16)
      }
    }
    return str.substr(1)
  }

  /**
     * Input the script from the script string format used in bitcoind data tests
     */
  fromAsmString (str) {
    this.chunks = []

    const tokens = str.split(' ')
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      let opCode, opCodeNum
      try {
        opCode = OpCode.fromString(token)
        opCodeNum = opCode.toNumber()
      } catch (err) {
        opCode = undefined
        opCodeNum = undefined
      }

      // we start with two special cases, 0 and -1, which are handled specially in
      // toASM. see _chunkToString.
      if (token === '0') {
        opCodeNum = 0
        this.chunks.push({
          opCodeNum: opCodeNum
        })
        i = i + 1
      } else if (token === '-1') {
        opCodeNum = OpCode.OP_1NEGATE
        this.chunks.push({
          opCodeNum: opCodeNum
        })
        i = i + 1
      } else if (opCode === undefined) {
        const hex = tokens[i]
        const buf = Buffer.from(hex, 'hex')
        if (buf.toString('hex') !== hex) {
          throw new Error('invalid hex string in script')
        }
        const len = buf.length
        if (len >= 0 && len < OpCode.OP_PUSHDATA1) {
          opCodeNum = len
        } else if (len < Math.pow(2, 8)) {
          opCodeNum = OpCode.OP_PUSHDATA1
        } else if (len < Math.pow(2, 16)) {
          opCodeNum = OpCode.OP_PUSHDATA2
        } else if (len < Math.pow(2, 32)) {
          opCodeNum = OpCode.OP_PUSHDATA4
        }
        this.chunks.push({
          buf: buf,
          len: buf.length,
          opCodeNum: opCodeNum
        })
        i = i + 1
      } else {
        this.chunks.push({
          opCodeNum: opCodeNum
        })
        i = i + 1
      }
    }
    return this
  }

  static fromAsmString (str) {
    return new this().fromAsmString(str)
  }

  /**
     * Output the script to the script string format used in bitcoind data tests.
     */
  toAsmString () {
    var str = ''
    for (var i = 0; i < this.chunks.length; i++) {
      var chunk = this.chunks[i]
      str += this._chunkToString(chunk)
    }

    return str.substr(1)
  }

  _chunkToString (chunk, type) {
    var opCodeNum = chunk.opCodeNum
    var str = ''
    if (!chunk.buf) {
      // no data chunk
      if (typeof OpCode.str[opCodeNum] !== 'undefined') {
        // A few cases where the opcode name differs from reverseMap
        // aside from 1 to 16 data pushes.
        if (opCodeNum === 0) {
          // OP_0 -> 0
          str = str + ' 0'
        } else if (opCodeNum === 79) {
          // OP_1NEGATE -> 1
          str = str + ' -1'
        } else {
          str = str + ' ' + new OpCode(opCodeNum).toString()
        }
      } else {
        var numstr = opCodeNum.toString(16)
        if (numstr.length % 2 !== 0) {
          numstr = '0' + numstr
        }
        str = str + ' ' + numstr
      }
    } else {
      // data chunk
      if (chunk.len > 0) {
        str = str + ' ' + chunk.buf.toString('hex')
      }
    }
    return str
  }

  fromOpReturnData (dataBuf) {
    this.writeOpCode(OpCode.OP_RETURN)
    this.writeBuffer(dataBuf)
    return this
  }

  static fromOpReturnData (dataBuf) {
    return new this().fromOpReturnData(dataBuf)
  }

  fromSafeData (dataBuf) {
    this.writeOpCode(OpCode.OP_FALSE)
    this.writeOpCode(OpCode.OP_RETURN)
    this.writeBuffer(dataBuf)
    return this
  }

  static fromSafeData (dataBuf) {
    return new this().fromSafeData(dataBuf)
  }

  fromSafeDataArray (dataBufs) {
    this.writeOpCode(OpCode.OP_FALSE)
    this.writeOpCode(OpCode.OP_RETURN)
    for (const i in dataBufs) {
      const dataBuf = dataBufs[i]
      this.writeBuffer(dataBuf)
    }
    return this
  }

  static fromSafeDataArray (dataBufs) {
    return new this().fromSafeDataArray(dataBufs)
  }

  getData () {
    if (this.isSafeDataOut()) {
      const chunks = this.chunks.slice(2)
      const buffers = chunks.map(chunk => chunk.buf)
      return buffers
    }
    if (this.isOpReturn()) {
      const chunks = this.chunks.slice(1)
      const buffers = chunks.map(chunk => chunk.buf)
      return buffers
    }
    throw new Error('Unrecognized script type to get data from')
  }

  /**
     * Turn script into a standard pubKeyHash output script
     */
  fromPubKeyHash (hashBuf) {
    if (hashBuf.length !== 20) {
      throw new Error('hashBuf must be a 20 byte buffer')
    }
    this.writeOpCode(OpCode.OP_DUP)
    this.writeOpCode(OpCode.OP_HASH160)
    this.writeBuffer(hashBuf)
    this.writeOpCode(OpCode.OP_EQUALVERIFY)
    this.writeOpCode(OpCode.OP_CHECKSIG)
    return this
  }

  static fromPubKeyHash (hashBuf) {
    return new this().fromPubKeyHash(hashBuf)
  }

  static sortPubKeys (pubKeys) {
    return pubKeys.slice().sort((pubKey1, pubKey2) => {
      const buf1 = pubKey1.toBuffer()
      const buf2 = pubKey2.toBuffer()
      const len = Math.max(buf1.length, buf2.length)
      for (let i = 0; i <= len; i++) {
        if (buf1[i] === undefined) {
          return -1 // shorter strings come first
        }
        if (buf2[i] === undefined) {
          return 1
        }
        if (buf1[i] < buf2[i]) {
          return -1
        }
        if (buf1[i] > buf2[i]) {
          return 1
        } else {
          continue
        }
      }
    })
  }

  /**
     * Generate a multisig output script from a list of public keys. sort
     * defaults to true. If sort is true, the pubKeys are sorted
     * lexicographically.
     */
  fromPubKeys (m, pubKeys, sort = true) {
    if (typeof m !== 'number') {
      throw new Error('m must be a number')
    }
    if (sort === true) {
      pubKeys = Script.sortPubKeys(pubKeys)
    }
    this.writeOpCode(m + OpCode.OP_1 - 1)
    for (const i in pubKeys) {
      this.writeBuffer(pubKeys[i].toBuffer())
    }
    this.writeOpCode(pubKeys.length + OpCode.OP_1 - 1)
    this.writeOpCode(OpCode.OP_CHECKMULTISIG)
    return this
  }

  static fromPubKeys (m, pubKeys, sort) {
    return new this().fromPubKeys(m, pubKeys, sort)
  }

  removeCodeseparators () {
    const chunks = []
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.chunks[i].opCodeNum !== OpCode.OP_CODESEPARATOR) {
        chunks.push(this.chunks[i])
      }
    }
    this.chunks = chunks
    return this
  }

  isPushOnly () {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const opCodeNum = chunk.opCodeNum
      if (opCodeNum > OpCode.OP_16) {
        return false
      }
    }
    return true
  }

  isNonSpendable () {
    const startsWithOpFalse = this.chunks[0].opCodeNum === OpCode.OP_FALSE
    const andThenReturns = this.chunks[1] && this.chunks[1].opCodeNum === OpCode.OP_RETURN
    return !!startsWithOpFalse && !!andThenReturns
  }

  isOpReturn () {
    if (
      this.chunks[0].opCodeNum === OpCode.OP_RETURN &&
        this.chunks.filter(chunk => Buffer.isBuffer(chunk.buf)).length === this.chunks.slice(1).length
    ) {
      return true
    } else {
      return false
    }
  }

  isSafeDataOut () {
    if (this.chunks.length < 2) {
      return false
    }
    if (this.chunks[0].opCodeNum !== OpCode.OP_FALSE) {
      return false
    }
    var chunks = this.chunks.slice(1)
    var script2 = new Script(chunks)
    return script2.isOpReturn()
  }

  isPubKeyHashOut () {
    if (
      this.chunks[0] &&
        this.chunks[0].opCodeNum === OpCode.OP_DUP &&
        this.chunks[1] &&
        this.chunks[1].opCodeNum === OpCode.OP_HASH160 &&
        this.chunks[2].buf &&
        this.chunks[3] &&
        this.chunks[3].opCodeNum === OpCode.OP_EQUALVERIFY &&
        this.chunks[4] &&
        this.chunks[4].opCodeNum === OpCode.OP_CHECKSIG
    ) {
      return true
    } else {
      return false
    }
  }

  /**
     * A pubKeyHash input should consist of two push operations. The first push
     * operation may be OP_0, which means the signature is missing, which is true
     * for some partially signed (and invalid) transactions.
     */
  isPubKeyHashIn () {
    if (
      this.chunks.length === 2 &&
        (this.chunks[0].buf || this.chunks[0].opCodeNum === OpCode.OP_0) &&
        (this.chunks[1].buf || this.chunks[0].opCodeNum === OpCode.OP_0)
    ) {
      return true
    } else {
      return false
    }
  }

  isScriptHashOut () {
    const buf = this.toBuffer()
    return (
      buf.length === 23 &&
        buf[0] === OpCode.OP_HASH160 &&
        buf[1] === 0x14 &&
        buf[22] === OpCode.OP_EQUAL
    )
  }

  /**
     * Note that these are frequently indistinguishable from pubKeyHashin
     */
  isScriptHashIn () {
    if (!this.isPushOnly()) {
      return false
    }
    try {
      new Script().fromBuffer(this.chunks[this.chunks.length - 1].buf)
    } catch (err) {
      return false
    }
    return true
  }

  isMultiSigOut () {
    const m = this.chunks[0].opCodeNum - OpCode.OP_1 + 1
    if (!(m >= 1 && m <= 16)) {
      return false
    }
    const pubKeychunks = this.chunks.slice(1, this.chunks.length - 2)
    if (
      !pubKeychunks.every(chunk => {
        try {
          const buf = chunk.buf
          const pubKey = new PubKey().fromDer(buf)
          pubKey.validate()
          return true
        } catch (err) {
          return false
        }
      })
    ) {
      return false
    }
    const n = this.chunks[this.chunks.length - 2].opCodeNum - OpCode.OP_1 + 1
    if (!(n >= m && n <= 16)) {
      return false
    }
    if (this.chunks[1 + n + 1].opCodeNum !== OpCode.OP_CHECKMULTISIG) {
      return false
    }
    return true
  }

  isMultiSigIn () {
    if (this.chunks[0].opCodeNum !== OpCode.OP_0) {
      return false
    }
    const remaining = this.chunks.slice(1)
    if (remaining.length < 1) {
      return false
    }
    return remaining.every(
      chunk => Buffer.isBuffer(chunk.buf) && Sig.IsTxDer(chunk.buf)
    )
  }

  /**
     * Analagous to bitcoind's FindAndDelete Find and deconste equivalent chunks,
     * typically used with push data chunks.  Note that this will find and deconste
     * not just the same data, but the same data with the same push data op as
     * produced by default. i.e., if a pushdata in a tx does not use the minimal
     * pushdata op, then when you try to remove the data it is pushing, it will not
     * be removed, because they do not use the same pushdata op.
     */
  findAndDelete (script) {
    const buf = script.toBuffer()
    for (let i = 0; i < this.chunks.length; i++) {
      const script2 = new Script([this.chunks[i]])
      const buf2 = script2.toBuffer()
      if (cmp(buf, buf2)) {
        this.chunks.splice(i, 1)
      }
    }
    return this
  }

  writeScript (script) {
    this.chunks = this.chunks.concat(script.chunks)
    return this
  }

  static writeScript (script) {
    return new this().writeScript(script)
  }

  writeString (str) {
    const script = new Script().fromString(str)
    this.chunks = this.chunks.concat(script.chunks)
    return this
  }

  static writeString (str) {
    return new this().writeString(str)
  }

  writeOpCode (opCodeNum) {
    this.chunks.push({ opCodeNum })
    return this
  }

  static writeOpCode (opCodeNum) {
    return new this().writeOpCode(opCodeNum)
  }

  setChunkOpCode (i, opCodeNum) {
    this.chunks[i] = { opCodeNum }
    return this
  }

  // write a big number in the minimal way
  writeBn (bn) {
    if (bn.cmp(0) === OpCode.OP_0) {
      this.chunks.push({
        opCodeNum: OpCode.OP_0
      })
    } else if (bn.cmp(-1) === 0) {
      this.chunks.push({
        opCodeNum: OpCode.OP_1NEGATE
      })
    } else if (bn.cmp(1) >= 0 && bn.cmp(16) <= 0) {
      // see OP_1 - OP_16
      this.chunks.push({
        opCodeNum: bn.toNumber() + OpCode.OP_1 - 1
      })
    } else {
      const buf = bn.toSm({ endian: 'little' })
      this.writeBuffer(buf)
    }
    return this
  }

  static writeBn (bn) {
    return new this().writeBn(bn)
  }

  writeNumber (number) {
    this.writeBn(new Bn().fromNumber(number))
    return this
  }

  static writeNumber (number) {
    return new this().writeNumber(number)
  }

  setChunkBn (i, bn) {
    this.chunks[i] = new Script().writeBn(bn).chunks[0]
    return this
  }

  // note: this does not necessarily write buffers in the minimal way
  // to write numbers in the minimal way, see writeBn
  writeBuffer (buf) {
    let opCodeNum
    const len = buf.length
    if (buf.length > 0 && buf.length < OpCode.OP_PUSHDATA1) {
      opCodeNum = buf.length
    } else if (buf.length === 0) {
      opCodeNum = OpCode.OP_0
    } else if (buf.length < Math.pow(2, 8)) {
      opCodeNum = OpCode.OP_PUSHDATA1
    } else if (buf.length < Math.pow(2, 16)) {
      opCodeNum = OpCode.OP_PUSHDATA2
    } else if (buf.length < Math.pow(2, 32)) {
      opCodeNum = OpCode.OP_PUSHDATA4
    } else {
      throw new Error("You can't push that much data")
    }
    this.chunks.push({
      buf: buf,
      len: len,
      opCodeNum: opCodeNum
    })
    return this
  }

  static writeBuffer (buf) {
    return new this().writeBuffer(buf)
  }

  setChunkBuffer (i, buf) {
    this.chunks[i] = new Script().writeBuffer(buf).chunks[0]
    return this
  }

  // make sure a push is the smallest way to push that particular data
  // comes from bitcoind's script interpreter CheckMinimalPush function
  checkMinimalPush (i) {
    const chunk = this.chunks[i]
    const buf = chunk.buf
    const opCodeNum = chunk.opCodeNum
    if (!buf) {
      return true
    }
    if (buf.length === 0) {
      // Could have used OP_0.
      return opCodeNum === OpCode.OP_0
    } else if (buf.length === 1 && buf[0] >= 1 && buf[0] <= 16) {
      // Could have used OP_1 .. OP_16.
      return opCodeNum === OpCode.OP_1 + (buf[0] - 1)
    } else if (buf.length === 1 && buf[0] === 0x81) {
      // Could have used OP_1NEGATE.
      return opCodeNum === OpCode.OP_1NEGATE
    } else if (buf.length <= 75) {
      // Could have used a direct push (opCode indicating number of bytes pushed + those bytes).
      return opCodeNum === buf.length
    } else if (buf.length <= 255) {
      // Could have used OP_PUSHDATA.
      return opCodeNum === OpCode.OP_PUSHDATA1
    } else if (buf.length <= 65535) {
      // Could have used OP_PUSHDATA2.
      return opCodeNum === OpCode.OP_PUSHDATA2
    }
    return true
  }
}

export { Script }
