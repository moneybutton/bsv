"use strict";
let Netbufs = require('../lib/netbufs');
let should = require('chai').should();

describe('Netbufs', function() {

  it('should satisfy this basic API', function() {
    let netbufs = Netbufs({}, {});
    should.exist(netbufs);
    should.exist(netbufs.opts);
    should.exist(netbufs.bufstream);
  });

  describe('buffers', function() {

    it('should give a buffer on new data', function() {
      let netbufs = Netbufs({}, true);
      let buffers = netbufs.buffers();
      let next = buffers.next();
      netbufs.onData(new Buffer([0]));
      return next.value
      .then(function(buf) {
        buf.length.should.equal(1);
      });
    });
    
    it('should yield error on sudden end', function() {
      let bufstream = {
        destroy: function() {}, //node
        close: function() {} //browser
      };
      let netbufs = Netbufs({}, bufstream);
      let buffers = netbufs.buffers();
      let next = buffers.next();
      netbufs.close();
      return next.value
      .catch(function(error) {
        error.message.should.equal('netbufs closed while buffer awaits outstanding');
        return buffers.next().value;
      })
      .then(function(buf) {
        should.not.exist(buf);
      });
    });
    
  });

});
