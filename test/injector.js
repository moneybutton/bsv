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
    inject = injector(inject, {});
    inject({one: 1});
    test.one.should.equal(1);
    (new (inject())() instanceof inject()).should.equal(true);
  });

  it('should know these classes are or are not equal', function() {
    let dependencies = {};
    function inject(deps) {
      return function Class() {
      }
    }
    let deps = {};
    inject = injector(inject, dependencies);
    inject(deps).should.equal(inject(deps));
    inject(deps).should.not.equal(inject({}));
  });

});
