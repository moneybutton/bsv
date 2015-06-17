"use strict";
let should = require('chai').should();
let Msg = require('../lib/msg');
let Connection = require('../lib/connection');

describe('Connection', function() {
  let msghex = "f9beb4d9696e76000000000000000000000000005df6e0e2";
  let msgbuf = new Buffer(msghex, 'hex');
  let msg = Msg().fromBuffer(msgbuf);

  it('should satisfy this basic API', function() {
    let con = Connection();
  });

  describe('#onData', function() {

    it('should call onMsg on a complete message', function() {
      let con = Connection();
      let called = false;
      con.onMsg = function() {
        called = true;
      };
      con.onData(msgbuf);
      called.should.equal(true);
    });

    it('should not call onMsg on an incomplete message', function() {
      let con = Connection();
      let called = false;
      con.onMsg = function() {
        called = true;
      };
      con.onData(msgbuf.slice(0, 1));
      called.should.equal(false);
    });

  });

  describe('#msgs', function() {

    it('should give an iterator that results in the first message', function() {
      let con = Connection();
      let msgs = con.msgs();
      let promise = msgs.next();
      return con.onData(msgbuf)
      .then(function() {
        return promise.value;
      }).then(function(msg) {
        (msg instanceof Msg).should.equal(true);
        msg.toHex().should.equal(msghex);
      });
    });

  });

});
