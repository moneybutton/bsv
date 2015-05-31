/**
 * Hash
 * ====
 *
 * Some hash functions are used through out bitcoin. We expose them here as a
 * convenience.
 */
"use strict";
let dependencies = {
  hashjs: require('hash.js')
};

function inject(deps) {
  let hashjs = deps.hashjs;

  let Hash = {};

  Hash.sha1 = function(buf) {
    if (!Buffer.isBuffer(buf))
      throw new Error('sha1 hash must be of a buffer');
    let hash = (new hashjs.sha1()).update(buf).digest();
    return new Buffer(hash);
  };

  Hash.sha1.blocksize = 512;

  Hash.sha256 = function(buf) {
    if (!Buffer.isBuffer(buf))
      throw new Error('sha256 hash must be of a buffer');
    let hash = (new hashjs.sha256()).update(buf).digest();
    return new Buffer(hash);
  };

  Hash.sha256.blocksize = 512;

  Hash.sha256sha256 = function(buf) {
    try {
      return Hash.sha256(Hash.sha256(buf));
    } catch (e) {
      throw new Error('sha256sha256 hash must be of a buffer: ' + e);
    }
  };

  Hash.ripemd160 = function(buf) {
    if (!Buffer.isBuffer(buf))
      throw new Error('ripemd160 hash must be of a buffer');
    let hash = (new hashjs.ripemd160()).update(buf).digest();
    return new Buffer(hash);
  };

  Hash.sha256ripemd160 = function(buf) {
    try {
      return Hash.ripemd160(Hash.sha256(buf));
    } catch (e) {
      throw new Error('sha256ripemd160 hash must be of a buffer: ' + e);
    }
  };

  Hash.sha512 = function(buf) {
    if (!Buffer.isBuffer(buf))
      throw new Error('sha512 hash must be of a buffer');
    let hash = (new hashjs.sha512()).update(buf).digest();
    return new Buffer(hash);
  };

  Hash.sha512.blocksize = 1024;

  Hash.hmac = function(hashfstr, data, key) {
    if (hashfstr !== 'sha1' && hashfstr !== 'sha256' && hashfstr !== 'sha512')
      throw new Error('invalid choice of hash function');

    let hashf = Hash[hashfstr];

    if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key))
      throw new Error('data and key must be buffers');

    //http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
    //http://tools.ietf.org/html/rfc4868#section-2
    let blocksize = hashf.blocksize / 8;
    
    if (key.length > blocksize)
      key = hashf(key);

    if (key.length < blocksize) {
      let fill = new Buffer(blocksize);
      fill.fill(0, key.length);
      key.copy(fill);
      key = fill;
    }

    let o_key_pad = new Buffer(blocksize);
    let i_key_pad = new Buffer(blocksize);
    for (let i = 0; i < blocksize; i++) {
      o_key_pad[i] = 0x5c ^ key[i];
      i_key_pad[i] = 0x36 ^ key[i];
    }

    return hashf(Buffer.concat([o_key_pad, hashf(Buffer.concat([i_key_pad, data]))]));
  };

  Hash.sha1hmac = function(data, key) {
    return Hash.hmac('sha1', data, key);
  };

  Hash.sha1hmac.bitsize = 160;

  Hash.sha256hmac = function(data, key) {
    return Hash.hmac('sha256', data, key);
  };

  Hash.sha256hmac.bitsize = 256;

  Hash.sha512hmac = function(data, key) {
    return Hash.hmac('sha512', data, key);
  };

  Hash.sha512hmac.bitsize = 512;

  return Hash;
}

inject = require('./injector')(inject, dependencies);
let Hash = inject();
module.exports = Hash;
