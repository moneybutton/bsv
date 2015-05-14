/**
 * AESCBC
 * ======
 *
 * This is a convenience class for using AES with CBC. This is a low-level tool
 * that does not include authentication. You should only use this if you are
 * authenticating your data somehow else.
 */
"use strict";
var AES = require('./aes');
var CBC = require('./cbc');
var Random = require('./random');
var Hash = require('./hash');

// Symmetric encryption with AES and CBC convenience class
var AESCBC = {};

AESCBC.encrypt = function(messagebuf, cipherkeybuf, ivbuf) {
  ivbuf = ivbuf || Random.getRandomBuffer(128 / 8);
  var ctbuf = CBC.encrypt(messagebuf, ivbuf, AES, cipherkeybuf);
  return Buffer.concat([ivbuf, ctbuf]);
};

AESCBC.decrypt = function(encbuf, cipherkeybuf) {
  var ivbuf = encbuf.slice(0, 128 / 8);
  var ctbuf = encbuf.slice(128 / 8);
  return CBC.decrypt(ctbuf, ivbuf, AES, cipherkeybuf);
};

module.exports = AESCBC;
