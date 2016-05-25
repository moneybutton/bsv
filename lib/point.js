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
let dependencies = {
  Bn: require('./bn'),
  elliptic: require('elliptic')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let elliptic = deps.elliptic

  let ec = elliptic.curves.secp256k1
  let _point = ec.curve.point()
  let _Point = _point.constructor

  class Point extends _Point {
    constructor (x, y, isRed) {
      super(ec.curve, x, y, isRed)
    }

    static fromX (isOdd, x) {
      let _point = ec.curve.pointFromX(x, isOdd)
      let point = Object.create(Point.prototype)
      return point.copyFrom(_point)
    }

    copyFrom (point) {
      if (!(point instanceof _Point)) {
        throw new Error('point should be an external point')
      }
      Object.keys(point).forEach(function (key) {
        this[key] = point[key]
      }.bind(this))
      return this
    }

    add (p) {
      p = _Point.prototype.add.call(this, p)
      let point = Object.create(Point.prototype)
      return point.copyFrom(p)
    }

    mul (bn) {
      let p = _Point.prototype.mul.call(this, bn)
      let point = Object.create(Point.prototype)
      return point.copyFrom(p)
    }

    mulAdd (bn1, point, bn2) {
      let p = _Point.prototype.mulAdd.call(this, bn1, point, bn2)
      point = Object.create(Point.prototype)
      return point.copyFrom(p)
    }

    getX () {
      let _x = _Point.prototype.getX.call(this)
      let x = Object.create(Bn.prototype)
      _x.copy(x)
      return x
    }

    getY () {
      let _y = _Point.prototype.getY.call(this)
      let y = Object.create(Bn.prototype)
      _y.copy(y)
      return y
    }

    fromX (isOdd, x) {
      let point = Point.fromX(isOdd, x)
      return this.copyFrom(point)
    }

    toJSON () {
      return {
        x: this.getX().toString(),
        y: this.getY().toString()
      }
    }

    fromJSON (json) {
      let x = new Bn().fromString(json.x)
      let y = new Bn().fromString(json.y)
      let point = new Point(x, y)
      return this.copyFrom(point)
    }

    toString () {
      return JSON.stringify(this.toJSON())
    }

    fromString (str) {
      let json = JSON.parse(str)
      let p = new Point().fromJSON(json)
      return this.copyFrom(p)
    }

    static getG () {
      let _g = ec.curve.g
      let g = Object.create(Point.prototype)
      return g.copyFrom(_g)
    }

    static getN () {
      return new Bn(ec.curve.n.toArray())
    }

    // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
    validate () {
      let p2 = Point.fromX(this.getY().isOdd(), this.getX())
      if (!(p2.getY().cmp(this.getY()) === 0)) {
        throw new Error('Invalid y value of public key')
      }
      if (!(this.getX().gt(-1) && this.getX().lt(Point.getN())) ||
        !(this.getY().gt(-1) && this.getY().lt(Point.getN()))) {
        throw new Error('Point does not lie on the curve')
      }
      if (!(this.mul(Point.getN()).isInfinity())) {
        throw new Error('Point times N must be infinity')
      }
      return this
    }
  }

  return Point
}

inject = require('injecter')(inject, dependencies)
let Point = inject()
module.exports = Point
