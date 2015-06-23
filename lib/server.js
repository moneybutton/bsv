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
  net: require('net'),
  Struct: require('./struct')
};

function inject(deps) {
  let Connection = deps.Connection;
  let Constants = deps.Constants;
  let net = deps.net;
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

  Server.prototype.createServer = function() {
    this.listener = net.createServer(this.onConnection.bind(this));
    this.listener.maxConnections = Constants.maxconnections;
    return this;
  };

  Server.prototype.listen = function() {
    if (!this.listener)
      this.createServer();
    this.createServer();
    let opts = {
      port: Constants.port
    };
    return new Promise(function(resolve, reject) {
      this.listener.listen(opts, resolve);
      this.listener.on('error', function(error) {
        reject(error);
      });
    }.bind(this));
  };

  Server.prototype.onConnection = function(bufstream) {
    let connection = Connection({}, bufstream);
    this.connections.push(connection);
    connection.monitor();
    return this;
  };

  Server.prototype.close = function() {
    let res, rej;
    this.listener.close(function(error) {
      if (error)
        rej(error);
      else
        res();
    });
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
