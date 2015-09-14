'use strict';
let extend = require('../lib/extend');
let should = require('chai').should();

describe('extend', function () {
  it('should extend these objects', function () {
    let obj = extend({}, {test: 1});
    obj.test.should.equal(1);
    extend(obj, {test: 2, hello: 3});
    obj.test.should.equal(2);
    obj.hello.should.equal(3);
  });

});
