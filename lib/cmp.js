/**
 * Buffer Compare
 * ==============
 *
 * Comparing two buffers to see if they are equal is the most common operation
 * of buffers that is not provided by default in node. Rather than include some
 * kind of extra convenience library for buffers, such as buffertools, we
 * simply provide that one convenience method for use here. There is one other
 * important comment, which is that buffer comparisons can leak timing
 * information in cryptography. Since fullnode is heavily cryptography, the
 * default comparison method, eq, is constant in time. A faster version,
 * fasteq, can be used for cases that are not security sensitive.
 */
"use strict";
let cmp = {};

module.exports = cmp;

/**
 * A constant-time comparison function. This should be used in any security
 * sensitive code where leaking timing information may lead to lessened
 * security. Note that if the buffers are not equal in length, this function
 * loops for the longest buffer, which may not be necessary. Usuall this
 * function should be used for buffers that would otherwise be equal length,
 * such as a hash.
 */
cmp.eq = function(buf1, buf2) {
  if (!Buffer.isBuffer(buf1) || !Buffer.isBuffer(buf2))
    throw new Error('buf1 and buf2 must be buffers');

  if (buf1.length < buf2.length) {
    let buf3 = buf1;
    buf1 = buf2;
    buf2 = buf3;
  }

  let d = 0;
  for (let i = 0; i < buf1.length; i++) {
    if (buf1[i] !== buf2[i])
      d++;
  }

  return d === 0;
};

/**
 * A fast comparison function that should be used for code that is not security
 * sensitive.
 */
cmp.fasteq = function(buf1, buf2) {
  if (!Buffer.isBuffer(buf1) || !Buffer.isBuffer(buf2))
    throw new Error('buf1 and buf2 must be buffers');

  if (buf1.length !== buf2.length)
    return false;

  if (buf1.length === 0)
    return true;

  for (let i = 0; i < buf1.length; i++) {
    if (buf1[i] !== buf2[i])
      return false;
  }

  return true;
};
