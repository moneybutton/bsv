'use strict';

module.exports = [{
  name: 'ECIES',
  message: 'Internal Error on bitcore-ecies Module {0}',
  errors: [{
    name: 'Unauthorized',
    message: 'Connection rejected: 401 unauthorized'
  }, {
    name: 'Forbidden',
    message: 'Connection rejected: 403 forbidden'
  }, {
    name: 'Connection',
    message: 'Could not connect to bitcoin via RPC at host: {0} port: {1}; Error: {2}'
  }]
}];


require('bitcore').errors.extend(module.exports);
