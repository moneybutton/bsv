var _BN = require('bn.js');

var BN = function BN(n, base) {
  if (!(this instanceof BN)) {
    return new BN(n, base);
  }
  _BN.apply(this, arguments);
};

BN.prototype = _BN.prototype;

var reversebuf = function(buf) {
  var nbuf = new Buffer(buf.length);
  for (var i = 0; i < buf.length; i++) {
    nbuf[i] = buf[buf.length-1-i];
  }
  return nbuf;
};

BN.prototype.toJSON = function() {
  return this.toString();
};

BN.prototype.fromJSON = function(str) {
  var bn = BN(str);
  bn.copy(this);
  return this;
};

BN.prototype.fromString = function(str) {
  var bn = BN(str);
  bn.copy(this);
  return this;
};

BN.fromBuffer = function(buf, opts) {
  if (typeof opts !== 'undefined' && opts.endian === 'little') {
    buf = reversebuf(buf);
  }
  var hex = buf.toString('hex');
  var bn = new BN(hex, 16);
  return bn;
};

BN.prototype.fromBuffer = function(buf, opts) {
  var bn = BN.fromBuffer(buf, opts);
  bn.copy(this);

  return this;
};

BN.prototype.toBuffer = function(opts) {
  var buf;
  if (opts && opts.size) {
    var hex = this.toString(16, 2);
    var natlen = hex.length/2;
    buf = new Buffer(hex, 'hex');

    if (natlen == opts.size)
      buf = buf;

    else if (natlen > opts.size) {
      buf = buf.slice(natlen - buf.length, buf.length);
    }

    else if (natlen < opts.size) {
      var rbuf = new Buffer(opts.size);
      //rbuf.fill(0);
      for (var i = 0; i < buf.length; i++)
        rbuf[rbuf.length-1-i] = buf[buf.length-1-i];
      for (var i = 0; i < opts.size - natlen; i++)
        rbuf[i] = 0;
      buf = rbuf;
    }
  }
  else {
    var hex = this.toString(16, 2);
    buf = new Buffer(hex, 'hex');
  }

  if (typeof opts !== 'undefined' && opts.endian === 'little') {
    buf = reversebuf(buf);
  }

  return buf;
};

function decorate(name) {
  BN.prototype['_' + name] = BN.prototype[name];
  var f = function(b) {
    if (typeof b === 'string')
      b = new BN(b);
    else if (typeof b === 'number')
      b = new BN(b.toString());
    return this['_' + name](b);
  };
  BN.prototype[name] = f;
};

BN.prototype.gt = function(b) {
  return this.cmp(b) > 0;
};

BN.prototype.lt = function(b) {
  return this.cmp(b) < 0;
};

decorate('add');
decorate('sub');
decorate('mul');
decorate('mod');
decorate('div');
decorate('cmp');
decorate('gt');
decorate('lt');

BN.prototype.toNumber = function() {
  return parseInt(this['toString'](10), 10);
};

module.exports = BN;
