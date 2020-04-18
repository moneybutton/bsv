/* global describe,it */
'use strict'
let should = require('should')
let bsv = require('../')

describe('bsv', function () {
  it('should pass this sanity check on loading the main package', function () {
    should.exist(bsv)
  })
})
