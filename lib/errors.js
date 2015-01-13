'use strict';

module.exports = [{
  name: 'ECIES',
  message: 'Internal Error on bitcore-ecies Module {0}',
  errors: [{
    name: 'InvalidPadding',
    message: 'Invalid padding: {0}'
  }]
}];


require('bitcore').errors.extend(module.exports);
