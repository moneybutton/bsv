/**
 * Injecter
 * ========
 *
 * This is a dependency injector specifically designed for use with Yours
 * Bitcoin. In order to allow injecting dependencies, Yours Bitcoin classes
 * provide an "inject" method that makes a new class with injected
 * dependencies. However, that method by itself presents a problem, because it
 * creates a new class every time it is used, leaving the burden of caching the
 * classes to the user. Thus the injector allows us to easily wrap an inject
 * method that keeps a cache of the created classes, lowing memory burden, and
 * allowing the instanceof operator to work correctly.
 */
'use strict'
let classmaps = new Map()

module.exports = function injector (inject, dependencies) {
  if (classmaps.get(inject) === undefined) {
    classmaps.set(inject, new Map())
  }

  let classmap = classmaps.get(inject)
  let meminject = function (deps) {
    let Class = classmap.get(deps)
    if (Class !== undefined) {
      return Class
    }

    Class = inject(Object.assign({}, dependencies, deps))
    classmap.set(deps, Class)

    // The "inject" and "injected" properties are non-enumerable so they don't
    // ruin any code that may enumerate properties of your classes.
    Object.defineProperty(Class, 'inject', {
      value: meminject,
      enumerable: false
    })
    Object.defineProperty(Class, 'injected', {
      value: deps,
      enumerable: false
    })
    return Class
  }

  return meminject
}
