'use strict'

var spec = {
  name: 'ECIES',
  message: 'Internal Error on bsv-ecies Module {0}',
  errors: [{
    name: 'InvalidPadding',
    message: 'Invalid padding: {0}'
  }]
}

module.exports = require('../../').errors.extend(spec)
