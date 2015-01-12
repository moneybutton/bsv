var cmp = require('../lib/cmp');
var should = require('chai').should();

describe('cmp', function() {

  describe('#eq', function() {
    
    it('should know if these buffers are equal', function() {
      var buf1 = new Buffer([]);
      var buf2 = new Buffer([]);
      cmp.eq(buf1, buf2).should.equal(true);

      var buf1 = new Buffer([1]);
      var buf2 = new Buffer([]);
      cmp.eq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([]);
      var buf2 = new Buffer([1]);
      cmp.eq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([1]);
      var buf2 = new Buffer([1]);
      cmp.eq(buf1, buf2).should.equal(true);

      var buf1 = new Buffer([1, 1]);
      var buf2 = new Buffer([1]);
      cmp.eq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([1]);
      var buf2 = new Buffer([1, 1]);
      cmp.eq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([1, 1]);
      var buf2 = new Buffer([1, 1]);
      cmp.eq(buf1, buf2).should.equal(true);

      var buf1 = new Buffer([1, 0]);
      var buf2 = new Buffer([1, 1]);
      cmp.eq(buf1, buf2).should.equal(false);
    });

  });

  describe('#fasteq', function() {
    
    it('should know if these buffers are equal', function() {
      var buf1 = new Buffer([]);
      var buf2 = new Buffer([]);
      cmp.fasteq(buf1, buf2).should.equal(true);

      var buf1 = new Buffer([1]);
      var buf2 = new Buffer([]);
      cmp.fasteq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([]);
      var buf2 = new Buffer([1]);
      cmp.fasteq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([1]);
      var buf2 = new Buffer([1]);
      cmp.fasteq(buf1, buf2).should.equal(true);

      var buf1 = new Buffer([1, 1]);
      var buf2 = new Buffer([1]);
      cmp.fasteq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([1]);
      var buf2 = new Buffer([1, 1]);
      cmp.fasteq(buf1, buf2).should.equal(false);

      var buf1 = new Buffer([1, 1]);
      var buf2 = new Buffer([1, 1]);
      cmp.fasteq(buf1, buf2).should.equal(true);

      var buf1 = new Buffer([1, 0]);
      var buf2 = new Buffer([1, 1]);
      cmp.fasteq(buf1, buf2).should.equal(false);
    });

  });

});
