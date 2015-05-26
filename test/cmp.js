"use strict";
let cmp = require('../lib/cmp');
let should = require('chai').should();

describe('cmp', function() {

  it('should know if these buffers are equal', function() {
    let buf1, buf2;

    buf1 = new Buffer([]);
    buf2 = new Buffer([]);
    cmp(buf1, buf2).should.equal(true);

    buf1 = new Buffer([1]);
    buf2 = new Buffer([]);
    cmp(buf1, buf2).should.equal(false);

    buf1 = new Buffer([]);
    buf2 = new Buffer([1]);
    cmp(buf1, buf2).should.equal(false);

    buf1 = new Buffer([1]);
    buf2 = new Buffer([1]);
    cmp(buf1, buf2).should.equal(true);

    buf1 = new Buffer([1, 1]);
    buf2 = new Buffer([1]);
    cmp(buf1, buf2).should.equal(false);

    buf1 = new Buffer([1]);
    buf2 = new Buffer([1, 1]);
    cmp(buf1, buf2).should.equal(false);

    buf1 = new Buffer([1, 1]);
    buf2 = new Buffer([1, 1]);
    cmp(buf1, buf2).should.equal(true);

    buf1 = new Buffer([1, 0]);
    buf2 = new Buffer([1, 1]);
    cmp(buf1, buf2).should.equal(false);

    buf1 = new Buffer([1]);
    buf2 = new Buffer([1, 0]);
    cmp(buf1, buf2).should.equal(false);

    (function() {
      let buf1 = "";
      let buf2 = new Buffer([0]);
      cmp(buf1, buf2);
    }).should.throw('buf1 and buf2 must be buffers');

    (function() {
      let buf1 = new Buffer([0]);
      let buf2 = "";
      cmp(buf1, buf2);
    }).should.throw('buf1 and buf2 must be buffers');

  });

});
