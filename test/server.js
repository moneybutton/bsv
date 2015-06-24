"use strict";
let Constants = require('../lib/constants').Regtest;
let Connection = require('../lib/connection');
let Msg = require('../lib/msg');
let Server = require('../lib/server').inject(Constants);
let should = require('chai').should();
let Network = process.browser ? require('peerjs') : undefined;
let Random = require('../lib/random');

describe('Server', function() {
  this.timeout(5000);

  it('should satisfy this basic API', function() {
    let server = Server();
    server.connections.length.should.equal(0);
  });

  describe('#listen', function() {
    let id, listener;

    if (process.browser) {
      before(function() {
        id = Random.getRandomBuffer(16).toString('hex');
        listener = new Network(id, Constants.Server.rendezvous);
        return new Promise(function(resolve, reject) {
          listener.on('open', resolve);
        });
      });
    }

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
      let server = Server();
      let connection, msgs, nextmsg;
      let ping = Msg().fromPing();
      return server.listen()
      .then(function() {
        if (!process.browser) {
          let address = server.listener.address();
          connection = Connection({
            address: address.address,
            port: address.port
          });
        } else {
          connection = Connection({
            id: server.listener.id
          }, listener);
        }
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
