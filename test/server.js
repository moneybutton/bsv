"use strict";
if (process.browser)
  return; // TODO: Somehow make work in browser
let Constants = require('../lib/constants').Regtest;
let Connection = require('../lib/connection');
let Msg = require('../lib/msg');
let Server = require('../lib/server').inject(Constants);
let should = require('chai').should();

describe('Server', function() {

  it('should satisfy this basic API', function() {
    let server = Server();
    server.connections.length.should.equal(0);
  });

  describe('#listen', function() {

    it('should be able to listen then close', function() {
      let server = Server();
      return server.listen()
      .then(function() {
        server.connections.length.should.equal(0);
        return server.close();
      });
    });

    it('should not be able to listen twice to due port in use', function() {
      let server1 = Server();
      let server2 = Server();
      return server1.listen()
      .then(function() {
        return server2.listen();
      })
      .then(function() {
        throw new Error('should not make it here');
      })
      .catch(function(error) {
        error.code.should.equal('EADDRINUSE');
        return server1.close();
      });
    });

    it('should be able to receive ping and respond with pong', function() {
      let server = Server();
      let connection, msgs, nextmsg;
      let ping = Msg().fromPing();
      return server.listen()
      .then(function() {
        let address = server.listener.address();
        connection = Connection({
          address: address.address,
          port: address.port
        });
        return connection.connect()
      })
      .then(function() {
        msgs = connection.msgs();
        nextmsg = msgs.next();
        return connection.send(ping);
      })
      .then(function() {
        return nextmsg.value;
      })
      .then(function(msg) {
        msg.getCmd().should.equal('pong');
      });
    });

  });

});
