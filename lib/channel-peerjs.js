/**
 * Network Channel (PeerJS)
 * ========================
 *
 * An abstraction over network connection streams in PeerJS.
 */
'use strict'
let dependencies = {
  Struct: require('./struct')
}

let inject = function (deps) {
  let Struct = deps.Struct

  function Channel (opts, bufstream, waits) {
    if (!(this instanceof Channel)) {
      return new Channel(opts, bufstream, waits)
    }
    this.initialize()
    this.fromObject({
      opts: opts,
      bufstream: bufstream,
      waits: waits
    })
  }

  Channel.prototype.fromObject = Struct.prototype.fromObject

  Channel.prototype.initialize = function () {
    this.opts = {}
    this.waits = []
  }

  Channel.prototype.monitor = function () {
    this.bufstream.on('data', this.onBuffer.bind(this))
    this.bufstream.on('close', this.onEnd.bind(this))
    this.bufstream.on('error', this.onError.bind(this))
    return this
  }

  Channel.prototype.send = function (buf) {
    return new Promise(function (resolve, reject) {
      this.bufstream.send(buf)
      resolve()
    }.bind(this))
  }

  Channel.prototype.waitBuffers = function *() {
    while (this.bufstream) {
      yield new Promise(function (resolve, reject) {
        this.waits.push({
          resolve: resolve,
          reject: reject
        })
      }.bind(this))
    }
  }

  Channel.prototype.onBuffer = function (arraybuffer) {
    let buf = new Buffer(new Uint8Array(arraybuffer))
    this.waits.forEach(function (wait) {
      wait.resolve(buf)
    })
    this.waits = []
    return this
  }

  Channel.prototype.onEnd = function () {
    delete this.bufstream
    return this
  }

  Channel.prototype.onError = function (error) {
    this.waits.forEach(function (wait) {
      wait.reject(error)
    })
    this.waits = []
    this.close()
    return this
  }

  Channel.prototype.close = function () {
    this.bufstream.close()
    delete this.bufstream
    this.waits.forEach(function (wait) {
      wait.reject(new Error('channel closed while buffer waits outstanding'))
    })
    this.waits = []
    return Promise.resolve()
  }

  return Channel
}

inject = require('./injector')(inject, dependencies)
let Channel = inject()
module.exports = Channel
