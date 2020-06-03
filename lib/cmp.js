/**
 * Constant-Time Buffer Compare
 * ============================
 *
 * A constant-time comparison function. This should be used in any security
 * sensitive code where leaking timing information may lead to lessened
 * security. Note that if the buffers are not equal in length, this function
 * loops for the longest buffer, which may not be necessary. Usually this
 * function should be used for buffers that would otherwise be equal length,
 * such as a hash, particularly Hmacs.
 *
 * The algorithm here, which is XORs each byte (or, if undefined, 0) with the
 * corresponding other byte, and then ORs that with a running total (d), is
 * adapted from here:
 *
 * https://groups.google.com/forum/#!topic/keyczar-discuss/VXHsoJSLKhM
 */
'use strict'
const cmp = (buf1, buf2) => {
  if (!Buffer.isBuffer(buf1) || !Buffer.isBuffer(buf2)) {
    throw new Error('buf1 and buf2 must be buffers')
  }
  if (buf1.length !== buf2.length) {
    return false
  }

  let d = 0
  for (let i = 0; i < buf1.length; i++) {
    const x = buf1[i]
    const y = buf2[i]
    d |= x ^ y
  }

  return d === 0
}

export { cmp }
