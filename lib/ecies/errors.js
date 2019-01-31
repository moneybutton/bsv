'use strict'

var spec = {
  name: 'ECIES',
  message: 'Internal Error on bsv-ecies Module {0}',
  errors: [{
    name: 'DecryptionError',
    message: 'Invalid Message: {0}'
  },
  {
    name: 'UnsupportAlgorithm',
    message: 'Unsupport Algorithm: {0}'
  }]
}

module.exports = require('../../').errors.extend(spec)
