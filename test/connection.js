'use strict';
let should = require('chai').should();
let Msg = require('../lib/msg');
let Connection = require('../lib/connection');

describe('Connection', function () {
  this.timeout(5000);

  let msghex = 'f9beb4d976657261636b000000000000000000005df6e0e2';
  let msgbuf = new Buffer(msghex, 'hex');
  let msg = Msg().fromBuffer(msgbuf);

  it('should satisfy this basic API', function () {
    let con = Connection();
  });

  describe('#onBuffer', function () {
    it('should call onMsg on a complete message', function () {
      let con = Connection();
      let called = false;
      con.onMsg = function () {
        called = true;
      };
      con.onBuffer(msgbuf);
      called.should.equal(true);
    });

    it('should not call onMsg on an incomplete message', function () {
      let con = Connection();
      let called = false;
      con.onMsg = function () {
        called = true;
      };
      con.onBuffer(msgbuf.slice(0, 1));
      called.should.equal(false);
    });

    it('should call onError on a message with wrong magicnum', function () {
      let con = Connection();
      con.channel = {
        close: function () {}
      };
      let called = false;
      let msgbuf2 = new Buffer(msgbuf);
      msgbuf2.writeUInt32BE(0, 0);
      return con.onBuffer(msgbuf2)
        .catch(function (error) {
          error.message.should.equal('cannot parse message: invalid magicnum');
        });
    });

  });

  describe('#onMsg', function () {
    it('should know this is a valid message', function () {
      let con = Connection();
      let msg = Msg().fromHex(msghex);
      let called = false;
      con.awaits = [];
      con.awaits[0] = {
        resolve: function (msg) {
          msg.toHex().should.equal(msghex);
          called = true;
        },
        reject: function (error) {
          throw new Error('should not be here: ' + error);
        }
      };
      return con.onMsg(msg)
        .then(function () {
          called.should.equal(true);
        });
    });

    it('should know this is an invalid message', function () {
      let con = Connection();
      con.channel = {
        close: function () {}
      };
      let msgbuf2 = new Buffer(msgbuf);
      msgbuf2[msgbuf2.length-1]++;
      let msghex = msgbuf2.toString('hex');
      let msg = Msg().fromHex(msghex);
      let called = false;
      con.awaits = [];
      con.awaits[0] = {
        resolve: function (msg) {
          throw new Error('should not be here');
        },
        reject: function (error) {
          error.toString().should.equal('Error: invalid message');
          called = true;
        }
      };
      return con.onMsg(msg)
        .then(function () {
          called.should.equal(true);
        });
    });

  });

  describe('#awaitMsgs', function () {
    it('should give an iterator that results in the first message', function () {
      let con = Connection();
      con.channel = {};
      let msgs = con.awaitMsgs();
      let promise = msgs.next();
      return con.onBuffer(msgbuf)
        .then(function () {
          return promise.value;
        }).then(function (msg) {
        (msg instanceof Msg).should.equal(true);
        msg.toHex().should.equal(msghex);
      });
    });

  });

});
