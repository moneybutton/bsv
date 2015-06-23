/**
 * Peer-to-Peer Network Connection
 * ===============================
 */
"use strict";
let dependencies = {
  Msg: require('./msg'),
  net: require('net'),
  Struct: require('./struct'),
  Work: require('./work')
};

function inject(deps) {
  let Msg = deps.Msg;
  let net = deps.net;
  let Struct = deps.Struct;
  let Work = deps.Work;

  function Connection(opts, bufstream, msgassembler, awaits) {
    if (!(this instanceof Connection))
      return new Connection(opts, bufstream, msgassembler, awaits);
    this.initialize();
    this.fromObject({
      opts: opts,
      bufstream: bufstream,
      msgassembler: msgassembler,
      awaits
    });
  }

  Connection.prototype.fromObject = Struct.prototype.fromObject;

  Connection.prototype.initialize = function() {
    this.awaits = [];
    return this;
  };
  
  Connection.prototype.monitor = function() {
    this.bufstream.on('data', this.onData.bind(this));
    this.bufstream.on('end', this.onEnd.bind(this));
    return this;
  };

  Connection.prototype.connect = function() {
    return new Promise(function(resolve, reject) {
      this.bufstream = net.connect(this.opts);
      this.bufstream.on('connect', resolve);
      this.bufstream.on('error', reject);
      this.monitor();
    }.bind(this));
  };

  Connection.prototype.disconnect = function() {
    this.bufstream.disconnect();
    return this;
  };

  Connection.prototype.close = function() {
    this.bufstream.close();
    return this;
  };

  Connection.prototype.onError = function(error) {
    this.destroy();
    return Promise.reject(error);
  };

  Connection.prototype.onData = function(buf) {
    if (!this.msgassembler) {
      this.msg = Msg();
      this.msgassembler = this.msg.fromBuffers({strict: true});
      this.msgassembler.next();
    }
    let next;
    try {
      next = this.msgassembler.next(buf);
    } catch (error) {
      delete this.msgassembler;
      return this.onError(error);
    }
    if (next.done) {
      let promise = this.onMsg(this.msg);
      delete this.msgassembler;
      let remainderbuf = next.value;
      if (remainderbuf.length > 0) {
        this.onData(remainderbuf);
      }
      return promise;
    }
    return Promise.resolve();
  };

  Connection.prototype.onEnd = function() {};

  Connection.prototype.onMsg = function(msg) {
    return Work(msg, 'isValid').buffer()
    .then(function(result) {
      if (result)
        this.autorespond(msg);
      this.awaits.forEach(function(await) {
        if (result) {
          await.resolve(msg);
        }
        else {
          await.reject(new Error('invalid message'));
        }
      }.bind(this));
      this.awaits = [];
    }.bind(this))
    .catch(function(error) {
      this.awaits.forEach(function(await) {
        await.reject(error.message);
      }.bind(this));
      this.awaits = [];
    }.bind(this));
  };

  /**
   * Returns an iterator of awaits to received messages.
   */
  Connection.prototype.msgs = function*() {
    while (true) {
      yield new Promise(function(resolve, reject) {
        this.awaits.push({resolve: resolve, reject: reject});
      }.bind(this));
    }
  };

  Connection.prototype.send = function(msg) {
    return new Promise(function(resolve, reject) {
      let res = this.bufstream.write(msg.toBuffer(), function() {
        resolve();
      });
      // TODO: When to call reject?
    }.bind(this));
  };

  /**
   * Handle connection-level responses, particularly ping/pong and veracks. For
   * higher-level responses, see the server.
   */
  Connection.prototype.autorespond = function(msg) {
    let cmd = msg.getCmd();
    let response;
    switch (cmd) {
      case "ping":
          response = Msg().fromPongFromPing(msg);
        break;
      default:
        break;
    }
    return this.send(response);
  };

  return Connection;
}

inject = require('./injector')(inject, dependencies);
let Connection = inject();
module.exports = Connection;
