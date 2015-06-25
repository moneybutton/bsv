/**
 * Network Buffers (i.e., low-level network connection)
 * ====================================================
 *
 * An abstraction over network connection streams in node, and web RTC data
 * streams in the browser (see channel-browser).
 */
"use strict";
let dependencies = {
  Struct: require('./struct')
};

function inject(deps) {
  let Struct = deps.Struct;

  function Channel(opts, bufstream, awaits) {
    if (!(this instanceof Channel))
      return new Channel(opts, bufstream, awaits);
    this.initialize();
    this.fromObject({
      opts: opts,
      bufstream: bufstream,
      awaits: awaits
    });
  };

  Channel.prototype.fromObject = Struct.prototype.fromObject;

  Channel.prototype.initialize = function() {
    this.opts = {};
    this.awaits = [];
  };

  Channel.prototype.monitor = function() {
    this.bufstream.on('data', this.onData.bind(this));
    this.bufstream.on('end', this.onEnd.bind(this));
    this.bufstream.on('error', this.onError.bind(this));
    return this;
  };

  Channel.prototype.send = function(buf) {
    return new Promise(function(resolve, reject) {
      this.bufstream.write(buf, resolve);
    }.bind(this));
  };

  Channel.prototype.awaitBuffers = function*() {
    while (this.bufstream) {
      yield new Promise(function(resolve, reject) {
        this.awaits.push({
          resolve: resolve,
          reject: reject
        });
      }.bind(this));
    }
  };

  Channel.prototype.onData = function(buf) {
    this.awaits.forEach(function(await) {
      await.resolve(buf);
    });
    this.awaits = [];
    return this;
  };

  Channel.prototype.onEnd = function() {
    delete this.bufstream;
    return this;
  };

  Channel.prototype.onError = function(error) {
    this.awaits.forEach(function(await) {
      await.reject(error);
    });
    this.awaits = [];
    this.close();
    return this;
  };

  Channel.prototype.close = function() {
    this.bufstream.destroy();
    delete this.bufstream;
    this.awaits.forEach(function(await) {
      await.reject(new Error('channel closed while buffer awaits outstanding'));
    });
    this.awaits = [];
    return Promise.resolve();
  };

  return Channel;
}

inject = require('./injector')(inject, dependencies);
let Channel = inject();
module.exports = Channel;
