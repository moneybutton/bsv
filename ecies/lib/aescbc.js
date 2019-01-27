'use strict';

var bitcore = require('bitcore-lib');

var $ = bitcore.util.preconditions;
var AES = require('./aes');
var CBC = require('./cbc');
var Random = bitcore.crypto.Random;
var Hash = bitcore.crypto.Hash;

// Symmetric encryption with AES and CBC convenience class
var AESCBC = function AESCBC() {};

AESCBC.encrypt = function(messagebuf, passwordstr) {
  $.checkArgument(messagebuf);
  $.checkArgument(passwordstr);
  var cipherkeybuf = Hash.sha256(new Buffer(passwordstr));
  return AESCBC.encryptCipherkey(messagebuf, cipherkeybuf);
};

AESCBC.decrypt = function(encbuf, passwordstr) {
  $.checkArgument(encbuf);
  $.checkArgument(passwordstr);
  var cipherkeybuf = Hash.sha256(new Buffer(passwordstr));
  return AESCBC.decryptCipherkey(encbuf, cipherkeybuf);
};

AESCBC.encryptCipherkey = function(messagebuf, cipherkeybuf, ivbuf) {
  $.checkArgument(messagebuf);
  $.checkArgument(cipherkeybuf);
  $.checkArgument(ivbuf);
  ivbuf = ivbuf || Random.getRandomBuffer(128 / 8);
  var ctbuf = CBC.encrypt(messagebuf, ivbuf, AES, cipherkeybuf);
  var encbuf = Buffer.concat([ivbuf, ctbuf]);
  return encbuf;
};

AESCBC.decryptCipherkey = function(encbuf, cipherkeybuf) {
  $.checkArgument(encbuf);
  $.checkArgument(cipherkeybuf);
  var ivbuf = encbuf.slice(0, 128 / 8);
  var ctbuf = encbuf.slice(128 / 8);
  var messagebuf = CBC.decrypt(ctbuf, ivbuf, AES, cipherkeybuf);
  return messagebuf;
};

module.exports = AESCBC;
