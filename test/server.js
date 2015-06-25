"use strict";
let Constants = require('../lib/constants').Regtest;
let Connection = require('../lib/connection');
let Msg = require('../lib/msg');
let Server = require('../lib/server').inject({Constants: Constants.Server});
let should = require('chai').should();
let Network = require('../lib/network').inject({Constants: Constants.Network});
let Random = require('../lib/random');

describe('Server', function() {
  this.timeout(5000);

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

    if (!process.browser) {
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
    }

    it('should be able to receive ping and respond with pong', function() {
      let server1 = Server({port: 8991});
      let server2 = Server({port: 8992});
      let connection, msgs;
      let ping = Msg().fromPing();
      return server1.listen()
      .then(function() {
        return server2.listen();
      })
      .then(function() {
        server1.monitor();
        server2.monitor();
        return server1.connect(server2.address());
      })
      .then(function(res) {
        connection = res;
        connection.monitor();
        msgs = connection.awaitMsgs();
        return connection.send(ping);
      })
      .then(function() {
        return msgs.next().value
      })
      .then(function(msg) {
        msg.getCmd().should.equal('pong');
      });
    });

  });

});
