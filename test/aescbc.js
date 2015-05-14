"use strict";
var should = require('chai').should();
var AESCBC = require('../lib/aescbc');
var vectors = require('./vectors/aescbc');

describe('AESCBC', function() {

  describe('@encrypt', function() {

    it('should return encrypt one block', function() {
      var cipherkeybuf = new Buffer(256 / 8);
      cipherkeybuf.fill(0x10);
      var ivbuf = new Buffer(128 / 8);
      ivbuf.fill(0);
      var messagebuf = new Buffer(128 / 8 - 1);
      messagebuf.fill(0);
      var encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf);
      encbuf.length.should.equal(128 / 8 + 128 / 8);
    });

    it('should return encrypt two blocks', function() {
      var cipherkeybuf = new Buffer(256 / 8);
      cipherkeybuf.fill(0x10);
      var ivbuf = new Buffer(128 / 8);
      ivbuf.fill(0);
      var messagebuf = new Buffer(128 / 8);
      messagebuf.fill(0);
      var encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf);
      encbuf.length.should.equal(128 / 8 + 128 / 8 + 128 / 8);
    });

  });

  describe('@decrypt', function() {
    
    it('should decrypt that which was encrypted', function() {
      var cipherkeybuf = new Buffer(256 / 8);
      cipherkeybuf.fill(0x10);
      var ivbuf = new Buffer(128 / 8);
      ivbuf.fill(0);
      var messagebuf = new Buffer(128 / 8);
      messagebuf.fill(0);
      var encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf);
      var messagebuf2 = AESCBC.decrypt(encbuf, cipherkeybuf);
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'));
    });

  });

  describe('vectors', function() {

    vectors.forEach(function(vector, i) {
      it('should pass sjcl test vector ' + i, function() {
        var keybuf = new Buffer(vector.key, 'hex');
        var ivbuf = new Buffer(vector.iv, 'hex');
        var ptbuf = new Buffer(vector.pt, 'hex');
        var ctbuf = new Buffer(vector.ct, 'hex');
        AESCBC.encrypt(ptbuf, keybuf, ivbuf).slice(128 / 8).toString('hex').should.equal(vector.ct);
        AESCBC.decrypt(Buffer.concat([ivbuf, ctbuf]), keybuf).toString('hex').should.equal(vector.pt);
      });
    });

  });

});
