/**
 * Injector
 * ========
 *
 * In order to allow injecting dependencies, fullnode classes provide an
 * "inject" method that makes a new class with injected dependencies. Rather
 * than create a new class every time you want to use one of them, we need to
 * keep a cache, so we can keep memory usage low. The injector keeps this
 * cache. If a class has already been created with a certain set of
 * dependencies, it is returned. Otherwise, a new class is created.
 */
"use strict";
let extend = require('./extend');
let classmaps = new Map();

module.exports = function injector(inject, dependencies, injected) {
  if (typeof classmaps.get(inject) === 'undefined')
    classmaps.set(inject, new Map());

  let classmap = classmaps.get(inject);

  if (typeof classmap.get(injected) !== 'undefined') {
    return classmap.get(injected);
  }

  dependencies = extend({}, dependencies, injected);
  let Class = inject(dependencies);
  Class.inject = inject;
  Class.injected = injected;
  classmap.set(injected, Class);
  return Class;
};


