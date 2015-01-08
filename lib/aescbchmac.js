/**
 * AES+CBC+HMAC
 * ============
 *
 * An "encrypt-then-MAC" that uses AES, CBC and SHA256 HMAC. This is suitable
 * for general encryption of data.
 *
 * The encrypted data takes the form:
 * (256 bit hmac)(128 bit iv)(128+ bits AES+CBC encrypted message)
 *
 * TODO: Compare the output of this code to SJCL and ensure equivalence.
 */
var AESCBC = require('./aescbc');
var Hash = require('./hash');

var ACH = function ACH() {
};

module.exports = ACH;

ACH.encryptCipherkey = function(messagebuf, cipherkeybuf, ivbuf) {
  var encbuf = AESCBC.encryptCipherkey(messagebuf, cipherkeybuf, ivbuf);
  var hmacbuf = Hash.sha256hmac(encbuf, cipherkeybuf);
  return Buffer.concat([hmacbuf, encbuf]);
};

ACH.decryptCipherkey = function(encbuf, cipherkeybuf) {
  if (encbuf.length < (256 + 128 + 128) / 8)
    throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the HMAC plus the iv plus the smallest encrypted data size');
  var hmacbuf = encbuf.slice(0, 256 / 8);
  encbuf = encbuf.slice(256 / 8, encbuf.length);
  var hmacbuf2 = Hash.sha256hmac(encbuf, cipherkeybuf);
  if (hmacbuf.toString('hex') !== hmacbuf2.toString('hex'))
    throw new Error('Message authentication failed - HMACs are not equivalent');
  return AESCBC.decryptCipherkey(encbuf, cipherkeybuf);
};
