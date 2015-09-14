/**
 * Injector
 * ========
 *
 * In order to allow injecting dependencies, fullnode classes provide an
 * "inject" method that makes a new class with injected dependencies. However,
 * that method by itself presents a problem, because it creates a new class
 * every time it is used, leaving the burden of caching the classes to the
 * user. Thus the injector allows us to easily wrap an inject method that keeps
 * a cache of the created classes, lowing memory burden, and allowing the
 * instanceof operator to work correctly.
 */
'use strict';
let extend = require('./extend');
let classmaps = new Map();

module.exports = function injector (inject, dependencies) {
  if (classmaps.get(inject) === undefined)
    classmaps.set(inject, new Map());

  let classmap = classmaps.get(inject);
  let meminject = function (deps) {
    let Class = classmap.get(deps);
    if (Class !== undefined)
      return Class;

    Class = inject(extend({}, dependencies, deps));
    classmap.set(deps, Class);
    Class.inject = meminject;
    Class.injected = deps;
    return Class;
  };

  return meminject;
};
