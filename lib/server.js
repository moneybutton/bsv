/**
 * Peer-to-Peer Network Server
 * ===========================
 *
 * Maintain connections to several different peers on the peer-to-peer network
 * and handle common network communications, including retrieving data from the
 * database if desired.
 */
'use strict';
let dependencies = {
  Connection: require('./connection'),
  Network: require('./network'),
  Random: require('./random'),
  Struct: require('./struct')
};

function inject (deps) {
  let Connection = deps.Connection;
  let Network = deps.Network;
  let Random = deps.Random;
  let Struct = deps.Struct;

  function Server (opts, networks, connections, channels, waits) {
    if (!(this instanceof Server))
      return new Server(opts, networks, connections, channels, waits);
    this.initialize();
    this.fromObject({
      opts: opts,
      networks: networks,
      connections: connections,
      channels: channels,
      waits: waits
    });
  }

  Server.prototype.fromObject = Struct.prototype.fromObject;

  Server.prototype.initialize = function () {
    this.networks = [];
    this.connections = [];
    return this;
  };

  Server.prototype.listen = function () {
    if (!this.networks[0])
      this.networks[0] = Network(this.opts);
    return this.networks[0].open();
  };

  Server.prototype.onChannel = function (channel) {
    let connection = Connection({}, channel);
    connection.monitor();
    this.waits.forEach(function (wait) {
      wait.resolve(channel);
    });
    let promise = this.channels.next().value;
    return promise ? promise.then(this.onChannel.bind(this)) : undefined;
  };

  Server.prototype.monitor = function () {
    if (!this.channels)
      this.channels = this.networks[0].waitChannels();
    let promise = this.channels.next().value;
    if (promise)
      promise.then(this.onChannel.bind(this));
    return this;
  };

  Server.prototype.waitConnections = function *() {
    return new Promise(function (resolve, reject) {
      this.waits.push({
        resolve: resolve,
        reject: reject
      });
    });
  };

  Server.prototype.address = function () {
    return this.networks[0].address();
  };

  Server.prototype.connect = function (opts) {
    return this.networks[0].connect(opts)
      .then(function (channel) {
        let connection = Connection(opts, channel);
        connection.monitor();
        return Promise.resolve(connection);
      });
  };

  Server.prototype.close = function () {
    return this.networks[0].close();
  };

  return Server;
}

inject = require('./injector')(inject, dependencies);
let Server = inject();
module.exports = Server;
