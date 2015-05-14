/**
 * ECDSA
 * =====
 *
 * ECDSA is the signature algorithm used by bitcoin. The way you probably want
 * to use this is with the static ECDSA.sign( ... ) and ECDSA.verify( ... )
 * functions. Note that in bitcoin, the hashbuf is little endian, so if you are
 * signing or verifying something that has to do with a transaction, you should
 * explicitly plug in that it is little endian as an option to the sign and
 * verify functions.
 *
 * This implementation of ECDSA uses deterministic signatures as defined in RFC
 * 6979 as the default, which has become a defacto standard in bitcoin wallets
 * due to recurring security issues around using a value of k pulled from a
 * possibly faulty entropy pool. If you use the same value of k twice, someone
 * can derive your private key. Deterministic k prevents this without needing
 * an entropy pool.
 */
"use strict";
var BN = require('./bn');
var Point = require('./point');
var Sig = require('./sig');
var Keypair = require('./keypair');
var Pubkey = require('./pubkey');
var Random = require('./random');
var Hash = require('./hash');

var ECDSA = function ECDSA(obj) {
  if (!(this instanceof ECDSA))
    return new ECDSA(obj);
  if (obj)
    this.set(obj);
};

ECDSA.prototype.set = function(obj) {
  this.hashbuf = obj.hashbuf || this.hashbuf;
  this.endian = obj.endian || this.endian; //the endianness of hashbuf
  this.keypair = obj.keypair || this.keypair;
  this.sig = obj.sig || this.sig;
  this.k = obj.k || this.k;
  this.verified = obj.verified || this.verified;
  return this;
};

ECDSA.prototype.calci = function() {
  for (var i = 0; i < 4; i++) {
    this.sig.i = i;
    try {
      var Qprime = this.sig2pubkey();
    } catch (e) {
      continue;
    }

    if (Qprime.point.eq(this.keypair.pubkey.point)) {
      this.sig.compressed = this.keypair.pubkey.compressed;
      return this;
    }
  }

  this.sig.i = undefined;
  throw new Error('Unable to find valid recovery factor');
};

ECDSA.prototype.fromString = function(str) {
  var obj = JSON.parse(str);
  if (obj.hashbuf)
    this.hashbuf = new Buffer(obj.hashbuf, 'hex');
  if (obj.keypair)
    this.keypair = Keypair().fromString(obj.keypair);
  if (obj.sig)
    this.sig = Sig().fromString(obj.sig);
  if (obj.k)
    this.k = BN(obj.k, 10);
  return this;
};

ECDSA.prototype.randomK = function() {
  var N = Point.getN();
  var k;
  do {
    k = BN().fromBuffer(Random.getRandomBuffer(32));
  } while (!(k.lt(N) && k.gt(0)));
  this.k = k;
  return this;
};

/**
 * The traditional ECDSA algorithm uses a purely random value of k. This has
 * the negative that when signing, your entropy must be good, or the private
 * key can be recovered if two signatures use the same value of k. It turns out
 * that k does not have to be purely random. It can be deterministic, so long
 * as an attacker can't guess it. RFC 6979 specifies how to do this using a
 * combination of the private key and the hash of the thing to be signed. It is
 * best practice to use this value, which can be tested for byte-for-byte
 * accuracy, and is resistant to a broken RNG. Note that it is actually the
 * case that bitcoin private keys have been compromised through that attack.
 * Deterministic k is a best practice.
 *
 * https://tools.ietf.org/html/rfc6979#section-3.2
 */
ECDSA.prototype.deterministicK = function(badrs) {
  var v = new Buffer(32);
  v.fill(0x01);
  var k = new Buffer(32);
  k.fill(0x00);
  var x = this.keypair.privkey.bn.toBuffer({size: 32});
  k = Hash.sha256hmac(Buffer.concat([v, new Buffer([0x00]), x, this.hashbuf]), k);
  v = Hash.sha256hmac(v, k);
  k = Hash.sha256hmac(Buffer.concat([v, new Buffer([0x01]), x, this.hashbuf]), k);
  v = Hash.sha256hmac(v, k);
  v = Hash.sha256hmac(v, k);
  var T = BN().fromBuffer(v);
  var N = Point.getN();

  // if r or s were invalid when this function was used in signing,
  // we do not want to actually compute r, s here for efficiency, so,
  // we can increment badrs. explained at end of RFC 6979 section 3.2
  if (typeof badrs === 'undefined')
    badrs = 0;
  // also explained in 3.2, we must ensure T is in the proper range (0, N)
  for (var i = 0; i < badrs || !(T.lt(N) && T.gt(0)); i++) {
    k = Hash.sha256hmac(Buffer.concat([v, new Buffer([0x00])]), k);
    v = Hash.sha256hmac(v, k);
    v = Hash.sha256hmac(v, k);
    T = BN().fromBuffer(v);
  }

  this.k = T;
  return this;
};

/**
 * Information about public key recovery:
 * https://bitcointalk.org/index.php?topic=6430.0
 * http://stackoverflow.com/questions/19665491/how-do-i-get-an-ecdsa-public-key-from-just-a-bitcoin-signature-sec1-4-1-6-k
 * This code was originally taken from BitcoinJS
 */
ECDSA.prototype.sig2pubkey = function() {
  var i = this.sig.i;
  if (!(i === 0 || i === 1 || i === 2 || i === 3))
    throw new Error('i must be equal to 0, 1, 2, or 3');

  var e = BN().fromBuffer(this.hashbuf);
  var r = this.sig.r;
  var s = this.sig.s;

  // A set LSB signifies that the y-coordinate is odd
  var isYOdd = i & 1;

  // The more significant bit specifies whether we should use the
  // first or second candidate key.
  var isSecondKey = i >> 1;

  var n = Point.getN();
  var G = Point.getG();

  // 1.1 Let x = r + jn
  var x = isSecondKey ? r.add(n) : r;
  var R = Point.fromX(isYOdd, x);

  // 1.4 Check that nR is at infinity
  var nR = R.mul(n);

  if (!nR.isInfinity())
    throw new Error('nR is not a valid curve point');

  // Compute -e from e
  var eNeg = e.neg().mod(n);

  // 1.6.1 Compute Q = r^-1 (sR - eG)
  // Q = r^-1 (sR + -eG)
  var rInv = r.invm(n);

  //var Q = R.multiplyTwo(s, G, eNeg).mul(rInv);
  var Q = R.mul(s).add(G.mul(eNeg)).mul(rInv);

  var pubkey = new Pubkey({point: Q});
  pubkey.compressed = this.sig.compressed;
  pubkey.validate();

  return pubkey;
};

ECDSA.prototype.verifystr = function() {
  if (!Buffer.isBuffer(this.hashbuf) || this.hashbuf.length !== 32)
    return 'hashbuf must be a 32 byte buffer';

  try {
    this.keypair.pubkey.validate();
  } catch (e) {
    return 'Invalid pubkey: ' + e;
  }

  var r = this.sig.r;
  var s = this.sig.s;
  if (!(r.gt(0) && r.lt(Point.getN()))
   || !(s.gt(0) && s.lt(Point.getN())))
    return 'r and s not in range';

  var e = BN().fromBuffer(this.hashbuf, this.endian ? {endian: this.endian} : undefined);
  var n = Point.getN();
  var sinv = s.invm(n);
  var u1 = sinv.mul(e).mod(n);
  var u2 = sinv.mul(r).mod(n);

  var p = Point.getG().mulAdd(u1, this.keypair.pubkey.point, u2);
  if (p.isInfinity())
    return 'p is infinity';

  if (!(p.getX().mod(n).cmp(r) === 0))
    return 'Invalid signature';
  else
    return false;
};

ECDSA.prototype.sign = function() {
  var hashbuf = this.hashbuf;
  var privkey = this.keypair.privkey;

  var d = privkey.bn;

  if (!hashbuf || !privkey || !d)
    throw new Error('invalid parameters');

  if (!Buffer.isBuffer(hashbuf) || hashbuf.length !== 32)
    throw new Error('hashbuf must be a 32 byte buffer');

  var N = Point.getN();
  var G = Point.getG();
  var e = BN().fromBuffer(hashbuf, this.endian ? {endian: this.endian} : undefined);

  // try different values of k until r, s are valid
  var badrs = 0;
  do {
    if (!this.k || badrs > 0)
      this.deterministicK(badrs);
    badrs++;
    var k = this.k;
    var Q = G.mul(k);
    var r = Q.x.mod(N);
    var s = k.invm(N).mul(e.add(d.mul(r))).mod(N);
  } while (r.cmp(0) <= 0 || s.cmp(0) <= 0);

  //enforce low s
  //see BIP 62, "low S values in signatures"
  if (s.gt(BN().fromBuffer(new Buffer('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
    s = Point.getN().sub(s);
  }

  this.sig = new Sig({r: r, s: s, compressed: this.keypair.pubkey.compressed});
  return this;
};

ECDSA.prototype.signRandomK = function() {
  this.randomK();
  return this.sign();
};

ECDSA.prototype.toString = function() {
  var obj = {};
  if (this.hashbuf)
    obj.hashbuf = this.hashbuf.toString('hex');
  if (this.keypair)
    obj.keypair = this.keypair.toString();
  if (this.sig)
    obj.sig = this.sig.toString();
  if (this.k)
    obj.k = this.k.toString();
  return JSON.stringify(obj);
};

ECDSA.prototype.verify = function() {
  if (!this.verifystr())
    this.verified = true;
  else
    this.verified = false;
  return this;
};

ECDSA.sign = function(hashbuf, keypair, endian) {
  return ECDSA().set({
    hashbuf: hashbuf,
    endian: endian,
    keypair: keypair
  }).sign().sig;
};

ECDSA.verify = function(hashbuf, sig, pubkey, endian) {
  return ECDSA().set({
    hashbuf: hashbuf,
    endian: endian,
    sig: sig,
    keypair: Keypair().set({pubkey: pubkey})
  }).verify().verified;
};

module.exports = ECDSA;
