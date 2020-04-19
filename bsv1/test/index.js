'use strict'

var should = require('chai').should()
var bsv = require('../')

describe('#versionGuard', function () {
  it('global._bsv should be defined', function () {
    should.equal(global._bsv, bsv.version)
  })

  it('throw an error if version is already defined', function () {
    (function () {
      bsv.versionGuard('version')
    }).should.not.throw('More than one instance of bsv')
  })
})
