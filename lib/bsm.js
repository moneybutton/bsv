/**
 * Bitcoin Signed Message
 * ======================
 *
 * "Bitcoin Signed Message" just refers to a standard way of signing and
 * verifying an arbitrary message. The standard way to do this involves using a
 * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
 * interested in the static BSM.sign( ... ) and BSM.verify( ... ) functions,
 * which deal with a base64 string representing the compressed format of a
 * signature.
 */
"use strict";
let dependencies = {
  Address: require('./address'),
  BW: require('./bw'),
  cmp: require('./cmp'),
  ECDSA: require('./ecdsa'),
  Hash: require('./hash'),
  Keypair: require('./keypair'),
  Pubkey: require('./pubkey'),
  Sig: require('./sig'),
  Struct: require('./struct')
};

function inject(deps) {
  let Address = deps.Address;
  let BW = deps.BW;
  let ECDSA = deps.ECDSA;
  let Hash = deps.Hash;
  let Keypair = deps.Keypair;
  let Pubkey = deps.Pubkey;
  let Sig = deps.Sig;
  let Struct = deps.Struct;
  let cmp = deps.cmp;

  function BSM(obj) {
    if (!(this instanceof BSM))
      return new BSM(obj);
    if (obj)
      this.fromObject(obj);
  };

  BSM.prototype = Object.create(Struct.prototype);
  BSM.prototype.constructor = BSM;

  BSM.magicBytes = new Buffer('Bitcoin Signed Message:\n');

  BSM.magicHash = function(messagebuf) {
    if (!Buffer.isBuffer(messagebuf))
      throw new Error('messagebuf must be a buffer');
    let bw = new BW();
    bw.writeVarintNum(BSM.magicBytes.length);
    bw.write(BSM.magicBytes);
    bw.writeVarintNum(messagebuf.length);
    bw.write(messagebuf);
    let buf = bw.toBuffer();

    let hashbuf = Hash.sha256sha256(buf);

    return hashbuf;
  };

  BSM.sign = function(messagebuf, keypair) {
    let m = BSM({messagebuf: messagebuf, keypair: keypair});
    m.sign();
    let sigbuf = m.sig.toCompact();
    let sigstr = sigbuf.toString('base64');
    return sigstr;
  };

  BSM.verify = function(messagebuf, sigstr, address) {
    let sigbuf = new Buffer(sigstr, 'base64');
    let message = new BSM();
    message.messagebuf = messagebuf;
    message.sig = Sig().fromCompact(sigbuf);
    message.address = address;

    return message.verify().verified;
  };

  BSM.prototype.sign = function() {
    let hashbuf = BSM.magicHash(this.messagebuf);
    let ecdsa = ECDSA({hashbuf: hashbuf, keypair: this.keypair});
    ecdsa.signRandomK();
    ecdsa.calcrecovery();
    this.sig = ecdsa.sig;
    return this;
  };

  BSM.prototype.verify = function() {
    let hashbuf = BSM.magicHash(this.messagebuf);

    let ecdsa = new ECDSA();
    ecdsa.hashbuf = hashbuf;
    ecdsa.sig = this.sig;
    ecdsa.keypair = new Keypair();
    ecdsa.keypair.pubkey = ecdsa.sig2pubkey();

    if (!ecdsa.verify()) {
      this.verified = false;
      return this;
    }

    let address = Address().fromPubkey(ecdsa.keypair.pubkey, undefined, this.sig.compressed);
    //TODO: what if livenet/testnet mismatch?
    if (cmp(address.hashbuf, this.address.hashbuf))
      this.verified = true;
    else
      this.verified = false;

    return this;
  };

  return BSM;
}

inject = require('./injector')(inject, dependencies);
let BSM = inject();
BSM.Mainnet = inject({
  Keypair: require('./keypair').Mainnet
});
BSM.Testnet = inject({
  Keypair: require('./keypair').Testnet
});
module.exports = BSM;
