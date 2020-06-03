/**
 * Random Number Generator
 * =======================
 *
 * Random numbers are important in bitcoin primarily for generating private
 * keys. It is also important for creating signatures if you are using a random
 * value of k, but Yours Bitcoin defaults to using deterministic k. That means
 * computing a random private key, or a random seed for use in Bip39 or Bip32,
 * is the primary use of the random number generator.  Note that the simplicity
 * of this class is extremely carefully considered. It is easy to audit that
 * this code runs node's randomBytes function. It is also easy to audit that
 * the randomBytes method is correctly interpreted as
 * window.crypto.getRandomValues when this code is browserified by browserify,
 * and thus also works correctly in the browser. We deliberately do not do
 * anything else to this random number in order to minimize possible errors in
 * this absolutely critical code.
 */
'use strict'

import randomBytes from 'randombytes'

class Random {}

Random.getRandomBuffer = function (size) {
  return randomBytes(size)
}

export { Random }
