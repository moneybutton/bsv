/**
 * KDF
 * ===
 *
 * KDF stands for "key derivation function". A key derivation function is a
 * function that converts random data into a properly formatted key that can be
 * used by a cryptographic function. The one you probably want to use is
 * PBKDF2, although various other ones are provided as a convenience.
 */
"use strict";
var BN = require('./bn');
var Privkey = require('./privkey');
var Point = require('./point');
var Pubkey = require('./pubkey');
var Keypair = require('./keypair');
var Hash = require('./hash');
var pbkdf2 = require('pbkdf2-compat');

var KDF = {};

// PBKDF2
// http://tools.ietf.org/html/rfc2898#section-5.2
// http://en.wikipedia.org/wiki/PBKDF2
KDF.PBKDF2 = function(passbuf, saltbuf, niterations, keylenbits, hashfstr) {
  if (!niterations)
    niterations = 1;
  if (!keylenbits)
    keylenbits = 512;
  if (!hashfstr)
    hashfstr = 'sha512';
  return pbkdf2.pbkdf2Sync(passbuf, saltbuf, niterations, keylenbits / 8, hashfstr);
};

KDF.buf2keypair = function(buf) {
  return KDF.sha256hmac2keypair(buf);
};

KDF.sha256hmac2keypair = function(buf) {
  var privkey = KDF.sha256hmac2privkey(buf);
  var keypair = Keypair().fromPrivkey(privkey);
  return keypair;
};

KDF.sha256hmac2privkey = function(buf) {
  var bn;
  var concat = new Buffer([]);
  do {
    var hash = Hash.sha256hmac(buf, concat);
    var bn = BN().fromBuffer(hash);
    concat = Buffer.concat([concat, new Buffer(0)]);
  } while(!bn.lt(Point.getN()));
  return new Privkey({bn: bn});
};

module.exports = KDF;
