'use strict'

var BN = require('./bn')

var EC = require('elliptic').ec
var ec = new EC('secp256k1')
var ecPoint = ec.curve.point.bind(ec.curve)
var ecPointFromX = ec.curve.pointFromX.bind(ec.curve)

/**
 * Instantiate a valid secp256k1 Point from the X and Y coordinates. This class
 * is just an extension of the secp256k1 code from the library "elliptic" by
 * Fedor Indutny. It includes a few extra features that are useful in Bitcoin.
 *
 * @param {BN|String} x - The X coordinate
 * @param {BN|String} y - The Y coordinate
 * @link https://github.com/indutny/elliptic
 * @augments elliptic.curve.point
 * @throws {Error} A validation error if exists
 * @returns {Point} An instance of Point
 * @constructor
 */
var Point = function Point (x, y, isRed) {
  try {
    var point = ecPoint(x, y, isRed)
  } catch (e) {
    throw new Error('Invalid Point')
  }
  point.validate()
  return point
}

Point.prototype = Object.getPrototypeOf(ec.curve.point())

/**
 *
 * Instantiate a valid secp256k1 Point from only the X coordinate. This is
 * useful to rederive a full point from the compressed form of a point.
 *
 * @param {boolean} odd - If the Y coordinate is odd
 * @param {BN|String} x - The X coordinate
 * @throws {Error} A validation error if exists
 * @returns {Point} An instance of Point
 */
Point.fromX = function fromX (odd, x) {
  try {
    var point = ecPointFromX(x, odd)
  } catch (e) {
    throw new Error('Invalid X')
  }
  point.validate()
  return point
}

/**
 *
 * Will return a secp256k1 ECDSA base point.
 *
 * @link https://en.bitcoin.it/wiki/Secp256k1
 * @returns {Point} An instance of the base point.
 */
Point.getG = function getG () {
  return ec.curve.g
}

/**
 *
 * Will return the max of range of valid private keys as governed by the
 * secp256k1 ECDSA standard.
 *
 * @link https://en.bitcoin.it/wiki/Private_key#Range_of_valid_ECDSA_private_keys
 * @returns {BN} A BN instance of the number of points on the curve
 */
Point.getN = function getN () {
  return new BN(ec.curve.n.toArray())
}

if (!Point.prototype._getX) { Point.prototype._getX = Point.prototype.getX }

/**
 * Will return the X coordinate of the Point.
 *
 * @returns {BN} A BN instance of the X coordinate
 */
Point.prototype.getX = function getX () {
  return new BN(this._getX().toArray())
}

if (!Point.prototype._getY) { Point.prototype._getY = Point.prototype.getY }

/**
 * Will return the Y coordinate of the Point.
 *
 * @returns {BN} A BN instance of the Y coordinate
 */
Point.prototype.getY = function getY () {
  return new BN(this._getY().toArray())
}

/**
 * Will determine if the point is valid.
 *
 * @link https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
 * @throws {Error} A validation error if exists
 * @returns {Point} An instance of the same Point
 */
Point.prototype.validate = function validate () {
  if (this.isInfinity()) {
    throw new Error('Point cannot be equal to Infinity')
  }

  var p2
  try {
    p2 = ecPointFromX(this.getX(), this.getY().isOdd())
  } catch (e) {
    throw new Error('Point does not lie on the curve')
  }

  if (p2.y.cmp(this.y) !== 0) {
    throw new Error('Invalid y value for curve.')
  }

  // todo: needs test case
  if (!(this.mul(Point.getN()).isInfinity())) {
    throw new Error('Point times N must be infinity')
  }

  return this
}

/**
 * A "compressed" format point is the X part of the (X, Y) point plus an extra
 * bit (which takes an entire byte) to indicate whether the Y value is odd or
 * not. Storing points this way takes a bit less space, but requires a bit more
 * computation to rederive the full point.
 *
 * @param {Point} point An instance of Point.
 * @returns {Buffer} A compressed point in the form of a buffer.
 */
Point.pointToCompressed = function pointToCompressed (point) {
  var xbuf = point.getX().toBuffer({ size: 32 })
  var ybuf = point.getY().toBuffer({ size: 32 })

  var prefix
  var odd = ybuf[ybuf.length - 1] % 2
  if (odd) {
    prefix = Buffer.from([0x03])
  } else {
    prefix = Buffer.from([0x02])
  }
  return Buffer.concat([prefix, xbuf])
}

/**
 * Converts a compressed buffer into a point.
 *
 * @param {Buffer} buf A compressed point.
 * @returns {Point} A Point.
 */
Point.pointFromCompressed = function (buf) {
  if (buf.length !== 33) {
    throw new Error('invalid buffer length')
  }
  let prefix = buf[0]
  let odd
  if (prefix === 0x03) {
    odd = true
  } else if (prefix === 0x02) {
    odd = false
  } else {
    throw new Error('invalid value of compressed prefix')
  }

  let xbuf = buf.slice(1, 33)
  let x = BN.fromBuffer(xbuf)
  return Point.fromX(odd, x)
}

/**
 * Convert point to a compressed buffer.
 *
 * @returns {Buffer} A compressed point.
 */
Point.prototype.toBuffer = function () {
  return Point.pointToCompressed(this)
}

/**
 * Convert point to a compressed hex string.
 *
 * @returns {string} A compressed point as a hex string.
 */
Point.prototype.toHex = function () {
  return this.toBuffer().toString('hex')
}

/**
 * Converts a compressed buffer into a point.
 *
 * @param {Buffer} buf A compressed point.
 * @returns {Point} A Point.
 */
Point.fromBuffer = function (buf) {
  return Point.pointFromCompressed(buf)
}

/**
 * Converts a compressed buffer into a point.
 *
 * @param {Buffer} hex A compressed point as a hex string.
 * @returns {Point} A Point.
 */
Point.fromHex = function (hex) {
  return Point.fromBuffer(Buffer.from(hex, 'hex'))
}

module.exports = Point
