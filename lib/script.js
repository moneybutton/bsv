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
var BR = require('./br');
var BW = require('./bw');
var BN = require('./bn');
var Opcode = require('./opcode');
var cmp = require('./cmp');

var Script = function Script(buf) {
  if (!(this instanceof Script))
    return new Script(buf);
  
  this.chunks = [];

  if (Buffer.isBuffer(buf)) {
    this.fromBuffer(buf);
  }
  else if (typeof buf === 'string') {
    var str = buf;
    this.fromString(str);
  }
  else if (typeof buf !== 'undefined') {
    var obj = buf;
    this.set(obj);
  }
};

Script.prototype.set = function(obj) {
  this.chunks = obj.chunks || this.chunks;
  return this;
};

Script.prototype.fromHex = function(hex) {
  return this.fromBuffer(new Buffer(hex, 'hex'));
};

Script.prototype.toHex = function() {
  return this.toBuffer().toString('hex');
};

Script.prototype.fromJSON = function(json) {
  return this.fromString(json);
};

Script.prototype.toJSON = function() {
  return this.toString();
};

Script.prototype.fromBuffer = function(buf) {
  this.chunks = [];

  var br = new BR(buf);
  while (!br.eof()) {
    var opcodenum = br.readUInt8();

    var len, buf;
    if (opcodenum > 0 && opcodenum < Opcode.OP_PUSHDATA1) {
      len = opcodenum;
      this.chunks.push({
        buf: br.read(len),
        len: len,
        opcodenum: opcodenum
      });
    } else if (opcodenum === Opcode.OP_PUSHDATA1) {
      len = br.readUInt8();
      var buf = br.read(len);
      this.chunks.push({
        buf: buf,
        len: len,
        opcodenum: opcodenum
      });
    } else if (opcodenum === Opcode.OP_PUSHDATA2) {
      len = br.readUInt16LE();
      buf = br.read(len);
      this.chunks.push({
        buf: buf,
        len: len,
        opcodenum: opcodenum
      });
    } else if (opcodenum === Opcode.OP_PUSHDATA4) {
      len = br.readUInt32LE();
      buf = br.read(len);
      this.chunks.push({
        buf: buf,
        len: len,
        opcodenum: opcodenum
      });
    } else {
      this.chunks.push({
        opcodenum: opcodenum
      });
    }
  }

  return this;
};

Script.prototype.toBuffer = function() {
  var bw = new BW();

  for (var i = 0; i < this.chunks.length; i++) {
    var chunk = this.chunks[i];
    var opcodenum = chunk.opcodenum;
    bw.writeUInt8(opcodenum);
    if (chunk.buf) {
      if (opcodenum < Opcode.OP_PUSHDATA1) {
        bw.write(chunk.buf);
      }
      else if (opcodenum === Opcode.OP_PUSHDATA1) {
        bw.writeUInt8(chunk.len);
        bw.write(chunk.buf);
      }
      else if (opcodenum === Opcode.OP_PUSHDATA2) {
        bw.writeUInt16LE(chunk.len);
        bw.write(chunk.buf);
      }
      else if (opcodenum === Opcode.OP_PUSHDATA4) {
        bw.writeUInt32LE(chunk.len);
        bw.write(chunk.buf);
      }
    }
  }

  return bw.concat();
};

Script.prototype.fromString = function(str) {
  this.chunks = [];
  if (str === '' || typeof str === 'undefined')
    return this;

  var tokens = str.split(' ');
  var i = 0;
  while (i < tokens.length) {
    var token = tokens[i];
    var opcode = Opcode(token);
    var opcodenum = opcode.toNumber();

    if (typeof opcodenum === 'undefined') {
      opcodenum = parseInt(token);
      if (opcodenum > 0 && opcodenum < Opcode.OP_PUSHDATA1) {
        this.chunks.push({
          buf: new Buffer(tokens[i + 1].slice(2), 'hex'),
          len: opcodenum,
          opcodenum: opcodenum
        });
        i = i + 2;
      } else if (opcodenum === 0) {
        this.chunks.push({
          opcodenum: 0
        });
        i = i + 1;
      } else {
        throw new Error('Invalid script');
      }
    } else if (opcodenum === Opcode.OP_PUSHDATA1 || opcodenum === Opcode.OP_PUSHDATA2 || opcodenum === Opcode.OP_PUSHDATA4) {
      if (tokens[i + 2].slice(0, 2) != '0x')
        throw new Error('Pushdata data must start with 0x');
      this.chunks.push({
        buf: new Buffer(tokens[i + 2].slice(2), 'hex'),
        len: parseInt(tokens[i + 1]),
        opcodenum: opcodenum
      });
      i = i + 3;
    } else {
      this.chunks.push({
        opcodenum: opcodenum
      });
      i = i + 1;
    }
  }
  return this;
};

Script.prototype.toString = function() {
  var str = "";

  for (var i = 0; i < this.chunks.length; i++) {
    var chunk = this.chunks[i];
    var opcodenum = chunk.opcodenum;
    if (!chunk.buf) {
      if (typeof Opcode.str[opcodenum] !== 'undefined')
        str = str + " " + Opcode(opcodenum).toString();
      else
        str = str + " " + "0x" + opcodenum.toString(16);
    } else {
      if (opcodenum === Opcode.OP_PUSHDATA1 || opcodenum === Opcode.OP_PUSHDATA2 || opcodenum === Opcode.OP_PUSHDATA4)
        str = str + " " + Opcode(opcodenum).toString();
      str = str + " " + chunk.len;
      str = str + " " + "0x" + chunk.buf.toString('hex');
    }
  }

  return str.substr(1);
};

/**
 * Input the script from the script string format used in bitcoind data tests
 */
Script.prototype.fromBitcoindString = function(str) {
  var bw = new BW();
  var tokens = str.split(' ');
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token === "")
      continue;
    if (token[0] === '0' && token[1] === 'x') {
      var hex = token.slice(2);
      bw.write(new Buffer(hex, 'hex'));
    } else if (token[0] === "'") {
      var tstr = token.slice(1, token.length - 1);
      var cbuf = new Buffer(tstr);
      var tbuf = Script().writeBuffer(cbuf).toBuffer();
      bw.write(tbuf);
    } else if (typeof Opcode['OP_' + token] !== 'undefined') {
      var opstr = "OP_" + token;
      var opcodenum = Opcode[opstr];
      bw.writeUInt8(opcodenum);
    } else if (typeof Opcode[token] === 'number') {
      var opstr = token;
      var opcodenum = Opcode[opstr];
      bw.writeUInt8(opcodenum);
    } else if (!isNaN(parseInt(token))) {
      var bn = BN(token);
      var script = Script().writeBN(bn);
      var tbuf = script.toBuffer();
      bw.write(tbuf);
    } else {
      throw new Error("Could not determine type of script value");
    }
  }
  var buf = bw.concat();
  return this.fromBuffer(buf);
};

/**
 * Output the script to the script string format used in bitcoind data tests.
 */
Script.prototype.toBitcoindString = function() {
  var str = "";
  for (var i = 0; i < this.chunks.length; i++) {
    var chunk = this.chunks[i];
    if (chunk.buf) {
      var buf = Script({chunks: [chunk]}).toBuffer();
      var hex = buf.toString('hex');
      str = str + " " + "0x" + hex;
    } else if (typeof Opcode.str[chunk.opcodenum] !== 'undefined') {
      var ostr = Opcode(chunk.opcodenum).toString();
      str = str + " " + ostr.slice(3); //remove OP_
    } else {
      str = str + " " + "0x" + chunk.opcodenum.toString(16);
    }
  }
  return str.substr(1);
};

/**
 * Turn script into a standard pubkeyhash output script
 */
Script.prototype.fromPubkeyhash = function(hashbuf) {
  if (hashbuf.length !== 20)
    throw new Error('hashbuf must be a 20 byte buffer');
  this.writeOp(Opcode.OP_DUP);
  this.writeOp(Opcode.OP_HASH160);
  this.writeBuffer(hashbuf);
  this.writeOp(Opcode.OP_EQUALVERIFY);
  this.writeOp(Opcode.OP_CHECKSIG);
  return this;
};

/**
 * Turn script into a standard scripthash (p2sh) output script
 */
Script.prototype.fromScripthash = function(hashbuf) {
  if (hashbuf.length !== 20)
    throw new Error('hashbuf must be a 20 byte buffer');
  this.writeOp(Opcode.OP_HASH160);
  this.writeBuffer(hashbuf);
  this.writeOp(Opcode.OP_EQUAL);
  return this;
};

Script.prototype.removeCodeseparators = function() {
  var chunks = [];
  for (var i = 0; i < this.chunks.length; i++) {
    if (this.chunks[i].opcodenum !== Opcode.OP_CODESEPARATOR) {
      chunks.push(this.chunks[i]);
    }
  }
  this.chunks = chunks;
  return this;
};

Script.prototype.isPushOnly = function() {
  for (var i = 0; i < this.chunks.length; i++) {
    var chunk = this.chunks[i];
    var opcodenum = chunk.opcodenum;
    if (opcodenum > Opcode.OP_16)
      return false;
  }
  return true;
};

Script.prototype.isOpReturn = function() {
  if (this.chunks[0].opcodenum === Opcode.OP_RETURN
    &&
    (this.chunks.length === 1
    ||
    (this.chunks.length === 2
    && this.chunks[1].buf
    && this.chunks[1].buf.length <= 40
    && this.chunks[1].length === this.chunks.len))) {
    return true;
  } else {
    return false;
  }
};

Script.prototype.isPubkeyhashOut = function() {
  if (this.chunks[0] && this.chunks[0].opcodenum === Opcode.OP_DUP
    && this.chunks[1] && this.chunks[1].opcodenum === Opcode.OP_HASH160
    && this.chunks[2].buf
    && this.chunks[3] && this.chunks[3].opcodenum === Opcode.OP_EQUALVERIFY
    && this.chunks[4] && this.chunks[4].opcodenum === Opcode.OP_CHECKSIG) {
    return true;
  } else {
    return false;
  }
};

/**
 * A pubkeyhash input should consist of two push operations. The first push
 * operation may be OP_0, which means the signature is missing, which is true
 * for some partially signed (and invalid) transactions.
 */
Script.prototype.isPubkeyhashIn = function() {
  if (this.chunks.length === 2
    && (this.chunks[0].buf || this.chunks[0].opcodenum === Opcode.OP_0)
    && this.chunks[1].buf) {
    return true;
  } else {
    return false;
  }
};

Script.prototype.isScripthashOut = function() {
  var buf = this.toBuffer();
  return (buf.length === 23 &&
          buf[0] === Opcode.OP_HASH160 &&
          buf[1] === 0x14 &&
          buf[22] === Opcode.OP_EQUAL);
};

/**
 * Note that these are frequently indistinguishable from pubkeyhashin
 */
Script.prototype.isScripthashIn = function() {
  var allpush = this.chunks.every(function(chunk) {
    return Buffer.isBuffer(chunk.buf);
  });
  if (allpush) {
    return true;
  } else {
    return false;
  }
};

/**
 * Analagous to bitcoind's FindAndDelete. Find and delete equivalent chunks,
 * typically used with push data chunks.  Note that this will find and delete
 * not just the same data, but the same data with the same push data op as
 * produced by default. i.e., if a pushdata in a tx does not use the minimal
 * pushdata op, then when you try to remove the data it is pushing, it will not
 * be removed, because they do not use the same pushdata op.
 */
Script.prototype.findAndDelete = function(script) {
  var buf = script.toBuffer();
  for (var i = 0; i < this.chunks.length; i++) {
    var script2 = Script({chunks: [this.chunks[i]]});
    var buf2 = script2.toBuffer();
    if (cmp.eq(buf, buf2))
      this.chunks.splice(i, 1);
  }
  return this;
};

Script.prototype.write = function(obj) {
  if (typeof obj === 'string')
    this.writeOp(obj);
  else if (typeof obj === 'number')
    this.writeOp(obj);
  else if (Buffer.isBuffer(obj))
    this.writeBuffer(obj);
  else if (typeof obj === 'object')
    this.chunks.push(obj);
  else
    throw new Error('Invalid script chunk');
  return this;
};

Script.prototype.writeOp = function(str) {
  if (typeof str === 'number')
    this.chunks.push({opcodenum: str});
  else
    this.chunks.push({opcodenum: Opcode(str).toNumber()});
  return this;
};

//write a big number in the minimal way
Script.prototype.writeBN = function(bn) {
  var opcodenum;
  if (bn.cmp(0) === Opcode.OP_0) {
    this.chunks.push({
      opcodenum: Opcode.OP_0
    });
  } else if (bn.cmp(-1) === 0) {
    this.chunks.push({
      opcodenum: Opcode.OP_1NEGATE
    });
  } else if (bn.cmp(1) >= 0 && bn.cmp(16) <= 0) { // see OP_1 - OP_16
    this.chunks.push({
      opcodenum: bn.toNumber() + Opcode.OP_1 - 1
    });
  } else {
    var buf = bn.toSM({endian: 'little'});
    this.writeBuffer(buf);
  }
  return this;
};

//note: this does not necessarily write buffers in the minimal way
//to write numbers in the minimal way, see writeBN
Script.prototype.writeBuffer = function(buf) {
  var opcodenum;
  var len = buf.length;
  if (buf.length > 0 && buf.length < Opcode.OP_PUSHDATA1) {
    opcodenum = buf.length;
  } else if (buf.length === 0) {
    opcodenum = Opcode.OP_0;
  } else if (buf.length < Math.pow(2, 8)) {
    opcodenum = Opcode.OP_PUSHDATA1;
  } else if (buf.length < Math.pow(2, 16)) {
    opcodenum = Opcode.OP_PUSHDATA2;
  } else if (buf.length < Math.pow(2, 32)) {
    opcodenum = Opcode.OP_PUSHDATA4;
  } else {
    throw new Error("You can't push that much data");
  }
  this.chunks.push({
    buf: buf,
    len: len,
    opcodenum: opcodenum
  });
  return this;
};

// make sure a push is the smallest way to push that particular data
// comes from bitcoind's script interpreter CheckMinimalPush function
Script.prototype.checkMinimalPush = function(i) {
  var chunk = this.chunks[i];
  var buf = chunk.buf;
  var opcodenum = chunk.opcodenum;
  if (!buf)
    return true;
  if (buf.length == 0) {
    // Could have used OP_0.
    return opcodenum == Opcode.OP_0;
  } else if (buf.length == 1 && buf[0] >= 1 && buf[0] <= 16) {
    // Could have used OP_1 .. OP_16.
    return opcodenum == Opcode.OP_1 + (buf[0] - 1);
  } else if (buf.length == 1 && buf[0] == 0x81) {
    // Could have used OP_1NEGATE.
    return opcodenum == Opcode.OP_1NEGATE;
  } else if (buf.length <= 75) {
    // Could have used a direct push (opcode indicating number of bytes pushed + those bytes).
    return opcodenum == buf.length;
  } else if (buf.length <= 255) {
    // Could have used OP_PUSHDATA.
    return opcodenum == Opcode.OP_PUSHDATA1;
  } else if (buf.length <= 65535) {
    // Could have used OP_PUSHDATA2.
    return opcodenum == Opcode.OP_PUSHDATA2;
  }
  return true;
};

module.exports = Script;
