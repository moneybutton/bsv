'use strict'

var buffer = require('buffer')

var $ = require('./preconditions')

module.exports = {
  /**
   * Returns true if the given argument is an instance of a buffer. Tests for
   * both node's Buffer and Uint8Array
   *
   * @param {*} arg
   * @return {boolean}
   */
  isBuffer: function isBuffer (arg) {
    return buffer.Buffer.isBuffer(arg) || arg instanceof Uint8Array
  },

  /**
   * Transforms a number from 0 to 255 into a Buffer of size 1 with that value
   *
   * @param {number} integer
   * @return {Buffer}
   */
  integerAsSingleByteBuffer: function integerAsSingleByteBuffer (integer) {
    $.checkArgumentType(integer, 'number', 'integer')
    return buffer.Buffer.from([integer & 0xff])
  },

  /**
   * Transform a 4-byte integer into a Buffer of length 4.
   *
   * @param {number} integer
   * @return {Buffer}
   */
  integerAsBuffer: function integerAsBuffer (integer) {
    $.checkArgumentType(integer, 'number', 'integer')
    var bytes = []
    bytes.push((integer >> 24) & 0xff)
    bytes.push((integer >> 16) & 0xff)
    bytes.push((integer >> 8) & 0xff)
    bytes.push(integer & 0xff)
    return Buffer.from(bytes)
  }

}
