/**
 * Extend
 * ======
 *
 * ES6 introduces Object.assign, which can extend objects with the properties
 * of other objects. This is similar to jQuery's extend, and other javascript
 * libraries. Unfortunately, as of this writing, Object.assign is not yet
 * available by default in io.js or node.js. Rather than include an enormous
 * external dependency for this one simple feature, we add an implementation of
 * it here for convenience.
 */
'use strict';
/**
 * Extend obj with the properties of the rest of the objects in the arguments;
 * last in wins. obj is mutated.
 */
module.exports = function extend (obj /*, ...rest*/) {
  let rest = Array.prototype.slice.call(arguments, 1);
  for (let e of rest) {
    if (!e)
      continue;
    for (let prop of Object.keys(e)) {
      obj[prop] = e[prop];
    }
  }
  return obj;
};
