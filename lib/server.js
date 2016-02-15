/**
 * Peer-to-Peer Network Server
 * ===========================
 *
 * Maintain connections to several different peers on the peer-to-peer network
 * and handle common network communications, including retrieving data from the
 * database if desired.
 */
'use strict'
let dependencies = {
  Connection: require('./connection'),
  Network: require('./network'),
  Struct: require('./struct'),
  asink: require('asink')
}

let inject = function (deps) {
  let Connection = deps.Connection
  let Network = deps.Network
  let Struct = deps.Struct
  let asink = deps.asink

  function Server (opts, networks, connections, channels, waits) {
    if (!(this instanceof Server)) {
      return new Server(opts, networks, connections, channels, waits)
    }
    this.initialize()
    this.fromObject({opts, networks, connections, channels, waits})
  }

  Server.prototype.fromObject = Struct.prototype.fromObject

  Server.prototype.initialize = function () {
    this.networks = []
    this.connections = []
    this.waits = []
    return this
  }

  Server.prototype.listen = function () {
    if (!this.networks[0]) {
      this.networks[0] = Network(this.opts)
    }
    return this.networks[0].open()
  }

  Server.prototype.onChannel = function (channel) {
    let connection = Connection({}, channel)
    connection.monitor()
    this.waits.forEach(function (wait) {
      wait.resolve(channel)
    })
    let promise = this.channels.next().value
    return promise ? promise.then(this.onChannel.bind(this)) : undefined
  }

  Server.prototype.monitor = function () {
    if (!this.channels) {
      this.channels = this.networks[0].waitChannels()
    }
    let promise = this.channels.next().value
    if (promise) {
      promise.then(this.onChannel.bind(this))
    }
    return this
  }

  Server.prototype.waitConnections = function *() {
    return new Promise(function (resolve, reject) {
      this.waits.push({
        resolve: resolve,
        reject: reject
      })
    })
  }

  Server.prototype.address = function () {
    return this.networks[0].address()
  }

  Server.prototype.connect = function (opts) {
    return asink(function *() {
      let channel = yield this.networks[0].connect(opts)
      let connection = Connection(opts, channel)
      connection.monitor()
      return connection
    }, this)
  }

  Server.prototype.close = function () {
    return this.networks[0].close()
  }

  return Server
}

inject = require('./injector')(inject, dependencies)
let Server = inject()
module.exports = Server
