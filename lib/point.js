/**
 * Point (on secp256k1)
 * ====================
 *
 * A point is a point on the secp256k1 curve which is the elliptic curve used
 * by bitcoin. This code is a wrapper for Fedor Indutny's Point class from his
 * elliptic library. This code adds a few minor conveniences, but is mostly the
 * same. Since Fedor's code returns points and big numbers that are instances
 * of his point and big number classes, we have to wrap all the methods such as
 * getX() to return the Yours Bitcoin point and big number types.
 */
'use strict'

import { Bn } from './bn'
import elliptic from 'bitcoin-elliptic'

const ec = elliptic.curves.secp256k1
const _point = ec.curve.point()
const _Point = _point.constructor

class Point extends _Point {
  constructor (x, y, isRed) {
    super(ec.curve, x, y, isRed)
  }

  static fromX (isOdd, x) {
    const _point = ec.curve.pointFromX(x, isOdd)
    const point = Object.create(Point.prototype)
    return point.copyFrom(_point)
  }

  copyFrom (point) {
    if (!(point instanceof _Point)) {
      throw new Error('point should be an external point')
    }
    Object.keys(point).forEach(
      function (key) {
        this[key] = point[key]
      }.bind(this)
    )
    return this
  }

  add (p) {
    p = _Point.prototype.add.call(this, p)
    const point = Object.create(Point.prototype)
    return point.copyFrom(p)
  }

  mul (bn) {
    if (!bn.lt(Point.getN())) {
      throw new Error('point mul out of range')
    }
    const p = _Point.prototype.mul.call(this, bn)
    const point = Object.create(Point.prototype)
    return point.copyFrom(p)
  }

  mulAdd (bn1, point, bn2) {
    const p = _Point.prototype.mulAdd.call(this, bn1, point, bn2)
    point = Object.create(Point.prototype)
    return point.copyFrom(p)
  }

  getX () {
    const _x = _Point.prototype.getX.call(this)
    const x = Object.create(Bn.prototype)
    _x.copy(x)
    return x
  }

  getY () {
    const _y = _Point.prototype.getY.call(this)
    const y = Object.create(Bn.prototype)
    _y.copy(y)
    return y
  }

  fromX (isOdd, x) {
    const point = Point.fromX(isOdd, x)
    return this.copyFrom(point)
  }

  toJSON () {
    return {
      x: this.getX().toString(),
      y: this.getY().toString()
    }
  }

  fromJSON (json) {
    const x = new Bn().fromString(json.x)
    const y = new Bn().fromString(json.y)
    const point = new Point(x, y)
    return this.copyFrom(point)
  }

  toString () {
    return JSON.stringify(this.toJSON())
  }

  fromString (str) {
    const json = JSON.parse(str)
    const p = new Point().fromJSON(json)
    return this.copyFrom(p)
  }

  static getG () {
    const _g = ec.curve.g
    const g = Object.create(Point.prototype)
    return g.copyFrom(_g)
  }

  static getN () {
    return new Bn(ec.curve.n.toArray())
  }

  // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
  validate () {
    const p2 = Point.fromX(this.getY().isOdd(), this.getX())
    if (!(p2.getY().cmp(this.getY()) === 0)) {
      throw new Error('Invalid y value of public key')
    }
    if (
      !(this.getX().gt(-1) && this.getX().lt(Point.getN())) ||
        !(this.getY().gt(-1) && this.getY().lt(Point.getN()))
    ) {
      throw new Error('Point does not lie on the curve')
    }
    return this
  }
}

export { Point }
