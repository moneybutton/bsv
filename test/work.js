"use strict";
let Work = require('../lib/work');
let Msg = require('../lib/msg');
let should = require('chai').should();

describe('Work', function() {

  it('should validate this message in a worker', function() {
    let msghex = "f9beb4d9696e76000000000000000000000000005df6e0e2";
    let msg = Msg().fromHex(msghex);
    return Work(msg, 'isValid').buffer()
    .then(function(result) {
      result.should.equal(true);
    });
  });

});
