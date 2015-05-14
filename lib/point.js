/**
 * Point (on secp256k1)
 * ====================
 *
 * A point is a point on the secp256k1 curve which is the elliptic curve used
 * by bitcoin. This code is a wrapper for Fedor Indutny's Point class from his
 * elliptic library. This code adds a few minor conveniences, but is mostly the
 * same.
 */
"use strict";
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

Point.prototype.copy = function(point) {
  for (var k in this) {
    if (this.hasOwnProperty(k)) {
      point[k] = this[k];
    }
  }
  return this;
};

Point.prototype.fromX = function(isOdd, x) {
  var point = Point.fromX(isOdd, x);
  point.copy(this);
  return this;
};

// note that this overrides the elliptic point toJSON method
Point.prototype.toJSON = function() {
  return {
    isOdd: this.x.isOdd(),
    x: this.x.toString()
  };
};

Point.prototype.fromJSON = function(json) {
  var point = Point().fromX(json.isOdd, BN().fromString(json.x));
  point.copy(this);
  return this;
};

Point.prototype.toString = function() {
  return JSON.stringify(this.toJSON());
};

Point.prototype.fromString = function(str) {
  var json = JSON.parse(str);
  var p = Point().fromJSON(json);
  p.copy(this);
  return this;
};

Point.getG = function() {
  var g = ec.curve.g;
  return g;
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
