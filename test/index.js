/* global describe,it */
'use strict'
let should = require('chai').should()
let YoursBitcoin = require('../')

describe('yours-bitcoin', function () {
  it('should pass this sanity check on loading the main package', function () {
    should.exist(YoursBitcoin)
  })
})
