/**
 * Point (on secp256k1)
 * ====================
 *
 * A point is a point on the secp256k1 curve which is the elliptic curve used
 * by bitcoin. This code is a wrapper for Fedor Indutny's Point class from his
 * elliptic library. This code adds a few minor conveniences, but is mostly the
 * same. Since Fedor's code returns points and big numbers that are instances
 * of his point and big number classes, we have to wrap all the methods such as
 * getX() to return the fullnode point and big number types.
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  elliptic: require('elliptic')
}

function inject (deps) {
  let BN = deps.BN
  let elliptic = deps.elliptic

  let ec = elliptic.curves.secp256k1
  let _point = ec.curve.point()
  let _Point = _point.constructor

  function Point (x, y, isRed) {
    if (!(this instanceof Point))
      return new Point(x, y, isRed)
    _Point.call(this, ec.curve, x, y, isRed)
  }

  Point.prototype = Object.create(_Point.prototype)
  Point.prototype.constructor = Point

  Point.fromX = function (isOdd, x) {
    let _point = ec.curve.pointFromX.call(ec.curve, x, isOdd)
    let point = Object.create(Point.prototype)
    return point.copyFrom(_point)
  }

  Point.prototype.copyFrom = function (point) {
    if (!(point instanceof _Point))
      throw new Error('point should be an external point')
    Object.keys(point).forEach(function (key) {
      this[key] = point[key]
    }.bind(this))
    return this
  }

  Point.prototype.add = function (p) {
    p = _Point.prototype.add.call(this, p)
    let point = Object.create(Point.prototype)
    return point.copyFrom(p)
  }

  Point.prototype.mul = function (bn) {
    let p = _Point.prototype.mul.call(this, bn)
    let point = Object.create(Point.prototype)
    return point.copyFrom(p)
  }

  Point.prototype.mulAdd = function (bn1, point, bn2) {
    let p = _Point.prototype.mulAdd.call(this, bn1, point, bn2)
    point = Object.create(Point.prototype)
    return point.copyFrom(p)
  }

  Point.prototype.getX = function () {
    let _x = _Point.prototype.getX.call(this)
    let x = Object.create(BN.prototype)
    _x.copy(x)
    return x
  }

  Point.prototype.getY = function () {
    let _y = _Point.prototype.getY.call(this)
    let y = Object.create(BN.prototype)
    _y.copy(y)
    return y
  }

  Point.prototype.fromX = function (isOdd, x) {
    let point = Point.fromX(isOdd, x)
    return this.copyFrom(point)
  }

  // note that this overrides the elliptic point toJSON method
  Point.prototype.toJSON = function () {
    return {
      isOdd: this.getX().isOdd(),
      x: this.getX().toString()
    }
  }

  Point.prototype.fromJSON = function (json) {
    let point = Point().fromX(json.isOdd, BN().fromString(json.x))
    return this.copyFrom(point)
  }

  Point.prototype.toString = function () {
    return JSON.stringify(this.toJSON())
  }

  Point.prototype.fromString = function (str) {
    let json = JSON.parse(str)
    let p = Point().fromJSON(json)
    return this.copyFrom(p)
  }

  Point.getG = function () {
    let _g = ec.curve.g
    let g = Object.create(Point.prototype)
    return g.copyFrom(_g)
  }

  Point.getN = function () {
    return BN(ec.curve.n.toArray())
  }

  // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
  Point.prototype.validate = function () {
    let p2 = Point.fromX(this.getY().isOdd(), this.getX())
    if (!(p2.getY().cmp(this.getY()) === 0))
      throw new Error('Invalid y value of public key')
    if (!(this.getX().gt(-1) && this.getX().lt(Point.getN()))
      || !(this.getY().gt(-1) && this.getY().lt(Point.getN())))
      throw new Error('Point does not lie on the curve')
    if (!(this.mul(Point.getN()).isInfinity()))
      throw new Error('Point times N must be infinity')
    return this
  }

  return Point
}

inject = require('./injector')(inject, dependencies)
let Point = inject()
module.exports = Point
