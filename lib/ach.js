/**
 * ACH (AES+CBC+HMAC)
 * ==================
 *
 * An "encrypt-then-MAC" that uses AES, CBC and SHA256 HMAC. This is suitable
 * for general encryption of data.
 *
 * The encrypted data takes the form:
 * (256 bit hmac)(128 bit iv)(128+ bits AES+CBC encrypted message)
 */
"use strict";
var AESCBC = require('./aescbc');
var Hash = require('./hash');
var cmp = require('./cmp');

var ACH = {};

module.exports = ACH;

ACH.encrypt = function(messagebuf, cipherkeybuf, ivbuf) {
  var encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf);
  var hmacbuf = Hash.sha256hmac(encbuf, cipherkeybuf);
  return Buffer.concat([hmacbuf, encbuf]);
};

ACH.decrypt = function(encbuf, cipherkeybuf) {
  if (encbuf.length < (256 + 128 + 128) / 8)
    throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the HMAC plus the iv plus the smallest encrypted data size');
  var hmacbuf = encbuf.slice(0, 256 / 8);
  encbuf = encbuf.slice(256 / 8, encbuf.length);
  var hmacbuf2 = Hash.sha256hmac(encbuf, cipherkeybuf);
  if (!cmp.eq(hmacbuf, hmacbuf2))
    throw new Error('Message authentication failed - HMACs are not equivalent');
  return AESCBC.decrypt(encbuf, cipherkeybuf);
};
