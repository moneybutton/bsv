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
  Network: require('./network'),
  Random: require('./random'),
  Struct: require('./struct')
};

function inject(deps) {
  let Connection = deps.Connection;
  let Constants = deps.Constants;
  let Network = deps.Network;
  let Random = deps.Random;
  let Struct = deps.Struct;

  function Server(opts, network, connections, netchannels, awaits) {
    if (!(this instanceof Server))
      return new Server(opts, network, connections, netchannels, awaits);
    this.initialize();
    this.fromObject({
      opts: opts,
      network: network,
      connections: connections,
      netchannels: netchannels,
      awaits: awaits
    });
  }

  Server.prototype.fromObject = Struct.prototype.fromObject;

  Server.prototype.initialize = function() {
    this.connections = [];
    return this;
  };

  Server.prototype.listen = function() {
    if (!this.network)
      this.network = Network(this.opts);
    return this.network.open();
  };

  Server.prototype.monitor = function() {
    if (!this.netchannels)
      this.netchannels = this.network.awaitNetchannels();
    let nextnetchannel = this.netchannels.next();
    return nextnetchannel.value
    .then(function(netchannel) {
      let connection = Connection({}, netchannel);
      connection.monitor();
      if (!nextnetchannel.done)
        return this.monitor();
      else
        return Promise.resolve();
    }.bind(this));
  };

  Server.prototype.awaitConnections = function*() {
    return new Promise(function(resolve, reject) {
      this.awaits.push({
        resolve: resolve,
        reject: reject
      });
    });
  };

  Server.prototype.address = function() {
    return this.network.address();
  };

  Server.prototype.connect = function(opts) {
    return this.network.connect(opts)
    .then(function(netchannel) {
      let connection = Connection(opts, netchannel);
      connection.monitor();
      return Promise.resolve(connection);
    });
  };

  Server.prototype.close = function() {
    return this.network.close();
  };

  return Server;
}

inject = require('./injector')(inject, dependencies);
let Server = inject();
module.exports = Server;
