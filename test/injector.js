"use strict";
let injector = require('../lib/injector');
let should = require('chai').should();

describe('injector', function() {

  it('should satisfy this basic API', function() {
    let test;
    function inject(deps) {
      test = deps;
      return function() {};
    }
    injector(inject, {}, {one: 1});
    test.one.should.equal(1);
  });

  it('should know these classes are or are not equal', function() {
    let dependencies = {};
    function inject(deps) {
      return function Class() {
      }
    }
    let deps = {};
    injector(inject, dependencies, deps).should.equal(injector(inject, dependencies, deps));
    injector(inject, dependencies, deps).should.not.equal(injector(inject, dependencies, {}));
  });

});
