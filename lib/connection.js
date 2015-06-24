/**
 * Peer-to-Peer Network Connection
 * ===============================
 */
"use strict";
let dependencies = {
  Msg: require('./msg'),
  Netbufs: require('./netbufs'),
  Struct: require('./struct'),
  Work: require('./work')
};

function inject(deps) {
  let Msg = deps.Msg;
  let Netbufs = deps.Netbufs;
  let Struct = deps.Struct;
  let Work = deps.Work;

  function Connection(opts, netbufs, buffers, msgassembler, awaits) {
    if (!(this instanceof Connection))
      return new Connection(opts, netbufs, buffers, msgassembler, awaits);
    this.initialize();
    this.fromObject({
      opts: opts,
      netbufs: netbufs,
      buffers: buffers,
      msgassembler: msgassembler,
      awaits
    });
  }

  Connection.prototype.fromObject = Struct.prototype.fromObject;

  Connection.prototype.initialize = function() {
    this.awaits = [];
    return this;
  };
  
  /**
   * Wait for buffers and assemble them into messages.
   */
  Connection.prototype.monitor = function() {
    if (!this.buffers) {
      this.buffers = this.netbufs.buffers();
    }
    let nextbuf = this.buffers.next();
    return nextbuf.value
    .then(function(buf) {
      this.onData(buf);
      if (nextbuf.done)
        return Promise.resolve();
      else
        return this.monitor();
    }.bind(this));
  };

  Connection.prototype.onData = function(buf) {
    if (!this.msgassembler) {
      this.msg = Msg();
      this.msgassembler = this.msg.fromBuffers({strict: true});
      this.msgassembler.next();
    }
    let nextmsg;
    try {
      nextmsg = this.msgassembler.next(buf);
    } catch (error) {
      this.close();
      return Promise.reject(new Error('cannot parse message: ' + error.message));
    }
    if (nextmsg.done) {
      let promise = this.onMsg(this.msg);
      delete this.msgassembler;
      let remainderbuf = nextmsg.value;
      if (remainderbuf.length > 0) {
        this.onData(remainderbuf);
      }
      return promise;
    }
    return Promise.resolve();
  };

  Connection.prototype.onMsg = function(msg) {
    return Work(msg, 'isValid').buffer()
    .then(function(result) {
      if (result)
        this.autorespond(msg);
      this.awaits.forEach(function(await) {
        if (result)
          await.resolve(msg);
        else {
          this.close();
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
    while (this.netbufs) {
      yield new Promise(function(resolve, reject) {
        this.awaits.push({
          resolve: resolve,
          reject: reject
        });
      }.bind(this));
    }
  };

  Connection.prototype.send = function(msg) {
    return this.netbufs.send(msg.toBuffer());
  };

  Connection.prototype.close = function() {
    return this.netbufs.close();
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
    if (response)
      return this.send(response);
    else
      return Promise.resolve();
  };

  return Connection;
}

inject = require('./injector')(inject, dependencies);
let Connection = inject();
module.exports = Connection;
