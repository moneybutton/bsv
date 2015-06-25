"use strict";
let Channel = require('../lib/channel');
let should = require('chai').should();

describe('Channel', function() {

  it('should satisfy this basic API', function() {
    let channel = Channel({}, {});
    should.exist(channel);
    should.exist(channel.opts);
    should.exist(channel.bufstream);
  });

  describe('#awaitBuffers', function() {

    it('should give a buffer on new data', function() {
      let channel = Channel({}, true);
      let buffers = channel.awaitBuffers();
      let next = buffers.next();
      channel.onData(new Buffer([0]));
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
      let channel = Channel({}, bufstream);
      let buffers = channel.awaitBuffers();
      let next = buffers.next();
      channel.close();
      return next.value
      .catch(function(error) {
        error.message.should.equal('channel closed while buffer awaits outstanding');
        return buffers.next().value;
      })
      .then(function(buf) {
        should.not.exist(buf);
      });
    });
    
  });

});
