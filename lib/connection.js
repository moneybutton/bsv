/**
 * Peer-to-Peer Network Connection
 * ===============================
 */
'use strict'
let dependencies = {
  Msg: require('./msg'),
  Struct: require('./struct'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Msg = deps.Msg
  let Struct = deps.Struct
  let Workers = deps.Workers
  let asink = deps.asink

  function Connection (opts, channel, buffers, msgassembler, waits) {
    if (!(this instanceof Connection)) {
      return new Connection(opts, channel, buffers, msgassembler, waits)
    }
    this.initialize()
    this.fromObject({opts, channel, buffers, msgassembler, waits})
  }

  Connection.prototype.fromObject = Struct.prototype.fromObject

  Connection.prototype.initialize = function () {
    this.waits = []
    return this
  }

  Connection.prototype.monitor = function () {
    if (!this.buffers) {
      this.buffers = this.channel.waitBuffers()
    }
    let promise = this.buffers.next().value
    if (promise) {
      promise.then(this.onBuffer.bind(this))
    }
    return this
  }

  Connection.prototype.onBuffer = function (buf) {
    if (!this.msgassembler) {
      this.msg = Msg()
      this.msgassembler = this.msg.fromBuffers({strict: true})
      this.msgassembler.next()
    }
    let nextmsg
    try {
      nextmsg = this.msgassembler.next(buf)
    } catch (error) {
      this.close()
      return Promise.reject(new Error('cannot parse message: ' + error.message))
    }
    if (nextmsg.done) {
      let promise = this.onMsg(this.msg)
      delete this.msgassembler
      let remainderbuf = nextmsg.value
      if (remainderbuf.length > 0) {
        return promise.then(function () {
          return this.onBuffer(remainderbuf)
        }.bind(this))
      }
      return promise
    }
    return Promise.resolve()
  }

  Connection.prototype.onMsg = function (msg) {
    return asink(function *() {
      try {
        let workersResult = yield Workers.asyncMethod(msg, 'isValid', [])
        let isValid = JSON.parse(workersResult.resbuf.toString())
        if (isValid) {
          yield this.autorespond(msg)
        } else {
          throw new Error('invalid message')
        }
        this.waits.forEach(function (wait) {
          wait.resolve(msg)
        })
        this.waits = []
      } catch (error) {
        this.close()
        this.waits.forEach(function (wait) {
          wait.reject(error)
        })
        this.waits = []
      }
    }, this)
  }

  /**
   * Returns an iterator of promises to received messages.
   */
  Connection.prototype.waitMsgs = function *() {
    while (this.channel) {
      yield new Promise(function (resolve, reject) {
        this.waits.push({
          resolve: resolve,
          reject: reject
        })
      }.bind(this))
    }
  }

  Connection.prototype.send = function (msg) {
    return this.channel.send(msg.toBuffer())
  }

  Connection.prototype.close = function () {
    return this.channel.close()
  }

  /**
   * Handle connection-level responses, particularly ping/pong and veracks. For
   * higher-level responses, see the server.
   */
  Connection.prototype.autorespond = function (msg) {
    let cmd = msg.getCmd()
    let response
    switch (cmd) {
      case 'ping':
        response = Msg().fromPongFromPing(msg)
        break
      default:
        break
    }
    if (response) {
      return this.send(response)
    } else {
      return Promise.resolve()
    }
  }

  return Connection
}

inject = require('./injector')(inject, dependencies)
let Connection = inject()
module.exports = Connection
