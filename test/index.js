/* global describe,it */
'use strict'
import should from 'should'
import * as bsv from '../entry'

describe('bsv', function () {
  it('should pass this sanity check on loading the main package', function () {
    should.exist(bsv)
  })
})
