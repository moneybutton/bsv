/**
 * ACH (AES+CBC+HMAC) (experimental)
 * =================================
 *
 * An "encrypt-then-MAC" that uses AES, CBC and SHA256 HMAC. This is suitable
 * for general encryption of data.
 *
 * The encrypted data takes the form:
 * (256 bit hmac)(128 bit iv)(128+ bits AES+CBC encrypted message)
 */
'use strict';
let dependencies = {
  AESCBC: require('./aescbc'),
  Hash: require('./hash'),
  cmp: require('./cmp')
};

function inject (deps) {
  let AESCBC = deps.AESCBC;
  let Hash = deps.Hash;
  let cmp = deps.cmp;

  let ACH = {};

  ACH.encrypt = function (messagebuf, cipherkeybuf, ivbuf) {
    let encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf);
    let hmacbuf = Hash.sha256hmac(encbuf, cipherkeybuf);
    return Buffer.concat([hmacbuf, encbuf]);
  };

  ACH.decrypt = function (encbuf, cipherkeybuf) {
    if (encbuf.length < (256 + 128 + 128) / 8)
      throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the HMAC plus the iv plus the smallest encrypted data size');
    let hmacbuf = encbuf.slice(0, 256 / 8);
    encbuf = encbuf.slice(256 / 8, encbuf.length);
    let hmacbuf2 = Hash.sha256hmac(encbuf, cipherkeybuf);
    if (!cmp(hmacbuf, hmacbuf2))
      throw new Error('Message authentication failed - HMACs are not equivalent');
    return AESCBC.decrypt(encbuf, cipherkeybuf);
  };

  return ACH;
}

inject = require('./injector')(inject, dependencies);
let ACH = inject();
module.exports = ACH;
