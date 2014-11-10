var BN = require('./bn');
var elliptic = require('elliptic');
var ec = elliptic.curves.secp256k1;

var Point = function Point(x, y, isRed) {
  return ec.curve.point(x, y, isRed);
};

var _point = ec.curve.point();
var _Point = _point.constructor;
Point.prototype = _Point.prototype;

Point.fromX = ec.curve.pointFromX.bind(ec.curve);

Point.getG = function() {
  var p = Point(ec.curve.g.getX(), ec.curve.g.getY());
  return p;
};

Point.getN = function() {
  return BN(ec.curve.n.toArray());
};

//https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
Point.prototype.validate = function() {
  var p2 = Point.fromX(this.getY().isOdd(), this.getX());
  if (!(p2.y.cmp(this.y) === 0))
    throw new Error('Invalid y value of public key');
  if (!(this.getX().gt(-1) && this.getX().lt(Point.getN()))
    ||!(this.getY().gt(-1) && this.getY().lt(Point.getN())))
    throw new Error('Point does not lie on the curve');
  if (!(this.mul(Point.getN()).isInfinity()))
    throw new Error('Point times N must be infinity');
  return this;
};

module.exports = Point;
