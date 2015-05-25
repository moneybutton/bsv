/**
 * Private Key
 * ===========
 *
 * A private key is used for signing transactions (or messages). The primary
 * way to use this is Privkey().fromRandom(), or Privkey().fromBuffer(buf).
 */
"use strict";
let dependencies = {
  BN: require('./bn'),
  Point: require('./point'),
  Constants: require('./constants').Mainnet.Privkey,
  Base58Check: require('./base58check'),
  Random: require('./random'),
  Struct: require('./struct')
};

let classmap = new Map();

function inject(deps) {
  if (typeof classmap.get(deps) !== 'undefined')
    return classmap.get(deps);

  function Privkey(bn, compressed) {
    if (!(this instanceof Privkey))
      return new Privkey(bn, compressed);
    this.fromObject({
      bn: bn,
      compressed: compressed
    });
  };

  Privkey.inject = inject;
  Privkey.prototype = deps && deps.Struct ? Object.create(deps.Struct.prototype)
                                  : Object.create(dependencies.Struct.prototype);
  Privkey.prototype.constructor = Privkey;

  Privkey.prototype.fromJSON = function(json) {
    this.fromString(json);
    return this;
  };

  Privkey.prototype.toJSON = function() {
    return this.toString();
  };

  Privkey.prototype.fromRandom = function() {
    let Random = this.constructor.Random;
    let Point = this.constructor.Point;
    let BN = this.constructor.BN;
    let privbuf, bn, condition;
    do {
      privbuf = Random.getRandomBuffer(32);
      bn = BN().fromBuffer(privbuf);
      condition = bn.lt(Point.getN());
    } while (!condition);
    this.fromObject({
      bn: bn,
      compressed: true
    });
    return this;
  };

  Privkey.prototype.toBuffer = function() {
    let Constants = this.constructor.Constants;
    let compressed = this.compressed;

    if (typeof compressed === 'undefined')
      compressed = true;

    let privbuf = this.bn.toBuffer({size: 32});
    let buf;
    if (compressed)
      buf = Buffer.concat([new Buffer([Constants.version]), this.bn.toBuffer({size: 32}), new Buffer([0x01])]);
    else
      buf = Buffer.concat([new Buffer([Constants.version]), this.bn.toBuffer({size: 32})]);

    return buf;
  };

  Privkey.prototype.fromBuffer = function(buf) {
    let BN = this.constructor.BN;
    let Constants = this.constructor.Constants;
    if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] == 1)
      this.compressed = true;
    else if (buf.length === 1 + 32)
      this.compressed = false;
    else
      throw new Error('Length of privkey buffer must be 33 (uncompressed pubkey) or 34 (compressed pubkey)');

    if (buf[0] !== Constants.version)
      throw new Error('Invalid version byte');

    return this.fromBN(BN().fromBuffer(buf.slice(1, 1 + 32)));
  };

  Privkey.prototype.toBN = function() {
    return this.bn;
  };

  Privkey.prototype.fromBN = function(bn) {
    this.bn = bn;
    return this;
  };

  Privkey.prototype.validate = function() {
    let Point = this.constructor.Point;
    if (!this.bn.lt(Point.getN()))
      throw new Error('Number must be less than N');
    if (typeof this.compressed !== 'boolean')
      throw new Error('Must specify whether the corresponding public key is compressed or not (true or false)');
    return this;
  };

  /**
   * Output the private key a Wallet Import Format (WIF) string.
   */
  Privkey.prototype.toWIF = function() {
    let Base58Check = this.constructor.Base58Check;
    return Base58Check.encode(this.toBuffer());
  };

  /**
   * Input the private key from a Wallet Import Format (WIF) string.
   */
  Privkey.prototype.fromWIF = function(str) {
    let Base58Check = this.constructor.Base58Check;
    return this.fromBuffer(Base58Check.decode(str));
  };

  Privkey.prototype.toString = function() {
    return this.toWIF();
  };

  Privkey.prototype.fromString = function(str) {
    return this.fromWIF(str);
  };

  for (let dep of Object.keys(dependencies)) {
    Privkey[dep] = dependencies[dep];
  }
  if (deps) {
    for (let dep of Object.keys(deps)) {
      Privkey[dep] = deps[dep];
    }
  }
  classmap.set(deps, Privkey);
  return Privkey;
}

let Privkey = inject();
Privkey.Testnet = inject({
  Constants: require('./constants').Testnet.Privkey
});
module.exports = Privkey;
