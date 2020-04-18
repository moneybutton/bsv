/* global describe,it */
'use strict'
let injecter = require('../lib/injecter')
require('should')

describe('injecter', function () {
  it('should satisfy this basic API', function () {
    let test
    let inject = function (deps) {
      test = deps
      return function () {}
    }
    inject = injecter(inject, {})
    inject({ one: 1 })
    test.one.should.equal(1)
    ;(new (inject())() instanceof inject()).should.equal(true)
  })

  it('should know these classes are or are not equal', function () {
    let dependencies = {}
    let inject = function (deps) {
      return function Class () {}
    }
    let deps = {}
    inject = injecter(inject, dependencies)
    inject(deps).should.equal(inject(deps))
    inject(deps).should.not.equal(inject({}))
  })
})
