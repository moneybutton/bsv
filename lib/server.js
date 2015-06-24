/**
 * Peer-to-Peer Network Server
 * ===========================
 *
 * Maintain connections to several different peers on the peer-to-peer network
 * and handle common network communications, including retrieving data from the
 * database if desired.
 */
"use strict";
let dependencies = {
  Connection: require('./connection'),
  Constants: require('./constants').Default.Server,
  net: !process.browser ? require('net') : undefined,
  Peer: process.browser ? require('peerjs') : undefined,
  Random: require('./random'),
  Struct: require('./struct')
};

function inject(deps) {
  let Connection = deps.Connection;
  let Constants = deps.Constants;
  let net = deps.net;
  let Peer = deps.Peer;
  let Random = deps.Random;
  let Struct = deps.Struct;

  function Server(listener, connections) {
    if (!(this instanceof Server))
      return new Server(listener, connections);
    this.initialize();
    this.fromObject({
      listener: listener,
      connections: connections
    });
  }

  Server.prototype.fromObject = Struct.prototype.fromObject;

  Server.prototype.initialize = function() {
    this.connections = [];
    return this;
  };

  Server.prototype.createListener = function() {
    if (!process.browser) {
      this.listener = net.createServer(this.onConnection.bind(this));
      this.listener.maxConnections = Constants.maxconnections;
    } else {
      let id = Random.getRandomBuffer(16).toString('hex');
      this.listener = new Peer(id, Constants.rendezvous);
      this.listener.on('connection', this.onConnection.bind(this));
    }
    return this;
  };

  Server.prototype.listen = function() {
    if (!this.listener)
      this.createListener();
    return new Promise(function(resolve, reject) {
      if (!process.browser) {
        let opts = {
          port: Constants.port
        };
        this.listener.listen(opts, resolve);
      } else {
        this.listener.on('open', resolve);
      }
      this.listener.on('error', function(error) {
        reject(error);
      });
    }.bind(this));
  };

  Server.prototype.onConnection = function(bufstream) {
    let connection = Connection({}, this.listener, bufstream);
    this.connections.push(connection);
    connection.monitor();
    return this;
  };

  Server.prototype.close = function() {
    let res, rej;
    if (!process.browser) {
      this.listener.close(function(error) {
        if (error)
          rej(error);
        else
          res();
      });
    } else {
      this.listener.disconnect();
      this.listener.on('disconnected', function() {
        res();
      });
      this.listener.on('error', function(error) {
        rej(error);
      });
    }
    return new Promise(function(resolve, reject) {
      res = resolve;
      rej = reject;
    }.bind(this));
  };

  return Server;
}

inject = require('./injector')(inject, dependencies);
let Server = inject();
module.exports = Server;
