"use strict";
let Constants = require('../lib/constants').Regtest;
let Connection = require('../lib/connection');
let Msg = require('../lib/msg');
let Network = require('../lib/network').inject({Constants: Constants.Network});
let Server = require('../lib/server').inject({
  Constants: Constants.Server,
  Network: Network
});
let should = require('chai').should();
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
