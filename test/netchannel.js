"use strict";
let Netchannel = require('../lib/netchannel');
let should = require('chai').should();

describe('Netchannel', function() {

  it('should satisfy this basic API', function() {
    let netchannel = Netchannel({}, {});
    should.exist(netchannel);
    should.exist(netchannel.opts);
    should.exist(netchannel.bufstream);
  });

  describe('buffers', function() {

    it('should give a buffer on new data', function() {
      let netchannel = Netchannel({}, true);
      let buffers = netchannel.buffers();
      let next = buffers.next();
      netchannel.onData(new Buffer([0]));
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
      let netchannel = Netchannel({}, bufstream);
      let buffers = netchannel.buffers();
      let next = buffers.next();
      netchannel.close();
      return next.value
      .catch(function(error) {
        error.message.should.equal('netchannel closed while buffer awaits outstanding');
        return buffers.next().value;
      })
      .then(function(buf) {
        should.not.exist(buf);
      });
    });
    
  });

});
