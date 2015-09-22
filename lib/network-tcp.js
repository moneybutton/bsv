/**
 * Network (TCP)
 * =============
 *
 * An abstraction over node's net module.
 */
'use strict'
let dependencies = {
  Channel: require('./channel-tcp'),
  Constants: require('./constants').Default.Network,
  extend: require('./extend'),
  net: require('net'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Channel = deps.Channel
  let Constants = deps.Constants
  let extend = deps.extend
  let net = deps.net
  let Struct = deps.Struct

  function Network (opts, netstream, waits) {
    if (!(this instanceof Network)) {
      return new Network(opts, netstream, waits)
    }
    this.initialize()
    this.fromObject({
      opts: opts,
      netstream: netstream,
      waits: waits
    })
  }

  Network.prototype.fromObject = Struct.prototype.fromObject

  Network.prototype.initialize = function () {
    this.opts = {}
    this.waits = []
  }

  Network.prototype.createNetstream = function () {
    this.netstream = net.createServer(this.onConnection.bind(this))
    this.netstream.maxConnections = Constants.maxconnections
    return this
  }

  Network.prototype.open = function () {
    if (!this.netstream)
      this.createNetstream()
    let opts = extend({}, Constants, this.opts)
    return new Promise(function (resolve, reject) {
      this.netstream.listen(opts, resolve)
      this.netstream.on('error', function (error) {
        reject(error)
      })
    }.bind(this))
  }

  Network.prototype.address = function () {
    return this.netstream.address()
  }

  Network.prototype.onConnection = function (bufstream) {
    let channel = Channel({}, bufstream)
    channel.monitor()
    this.waits.forEach(function (wait) {
      wait.resolve(channel)
    })
    return this
  }

  Network.prototype.waitChannels = function *() {
    while (this.netstream) {
      yield new Promise(function (resolve, reject) {
        this.waits.push({
          resolve: resolve,
          reject: reject
        })
      }.bind(this))
    }
  }

  Network.prototype.connect = function (opts) {
    return new Promise(function (resolve, reject) {
      let bufstream = net.connect(opts)
      bufstream.on('connect', function () {
        let channel = Channel(opts, bufstream)
        channel.monitor()
        resolve(channel)
      })
      bufstream.on('error', reject)
    }.bind(this))
  }

  /**
   * Close the network. Note that this promise will not resolve until all
   * connections on this network are also closed.
   */
  Network.prototype.close = function () {
    return new Promise(function (resolve, reject) {
      this.netstream.close(function (error) {
        if (error)
          reject(error)
        else
          resolve()
      })
      delete this.netstream
    }.bind(this))
  }

  return Network
}

inject = require('./injector')(inject, dependencies)
let Network = inject()
module.exports = Network
