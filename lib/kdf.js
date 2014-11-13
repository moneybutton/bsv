var Bn = require('./bn');
var Privkey = require('./privkey');
var Point = require('./point');
var Pubkey = require('./pubkey');
var Keypair = require('./keypair');
var Hash = require('./hash');

function KDF() {
};

// PBKDF2
// http://tools.ietf.org/html/rfc2898#section-5.2
// http://en.wikipedia.org/wiki/PBKDF2
KDF.PBKDF2 = function(passbuf, saltbuf, niterations, keylenbits, hmacf) {
  hmacf = hmacf || Hash.sha512hmac;
  niterations = niterations || 1;
  keylenbits = keylenbits || 512;

  var hlen = hmacf.bitsize;

  var T = [];
  for (var i = 1; i <= Math.ceil(keylenbits / hlen); i++) {
    var ibuf = new Buffer(4);
    ibuf.writeUInt32BE(i, 0);
    buf = hmacf(Buffer.concat([saltbuf, ibuf]), passbuf);
    var xor = new Buffer(buf.length);
    buf.copy(xor);
    for (var j = 1; j < niterations; j++) {
      var buf = hmacf(buf, passbuf);
      for (var k = 0; k < hlen; k++) {
        xor[k] = xor[k] ^ buf[k];
      }
    }
    T[i - 1] = xor;
  }

  return Buffer.concat(T).slice(0, keylenbits / 8);
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
    var bn = Bn.fromBuffer(hash);
    concat = Buffer.concat([concat, new Buffer(0)]);
  } while(!bn.lt(Point.getN()));
  return new Privkey({bn: bn});
};

module.exports = KDF;
