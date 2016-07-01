/* global describe,it */
'use strict'
let txInvalid = require('./vectors/bitcoind/tx_invalid')
let txValid = require('./vectors/bitcoind/tx_valid')
let testTxVerifierPartial = require('./helpers/tx-verifier').testTxVerifierPartial

describe('TxVerifier Vectors 3/4', function () {
  testTxVerifierPartial(it, txValid, txInvalid, 2)
})
