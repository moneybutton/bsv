/* global describe,it */
'use strict'
let should = require('chai').should()
let Fullnode = require('../')

describe('fullnode', function () {
  it('should pass this sanity check on loading the main package', function () {
    should.exist(Fullnode)
  })
})
