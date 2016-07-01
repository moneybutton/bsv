/* global describe,it */
'use strict'
let scriptValid = require('./vectors/bitcoind/script_valid')
let scriptInvalid = require('./vectors/bitcoind/script_invalid')
let testInterpPartial = require('./helpers/interp').testInterpPartial

describe('Interp Vectors 4/4', function () {
  testInterpPartial(it, scriptValid, scriptInvalid, 3)
})
