/**
 * Network Buffers (i.e., low-level network connection)
 * ====================================================
 *
 * An abstraction over network connection streams in node, and web RTC data
 * streams in the browser (see netbufs-browser).
 */
"use strict";
let dependencies = {
  Struct: require('./struct')
};

function inject(deps) {
  let Struct = deps.Struct;

  function Netbufs(opts, bufstream, awaits) {
    if (!(this instanceof Netbufs))
      return new Netbufs(opts, bufstream, awaits);
    this.initialize();
    this.fromObject({
      opts: opts,
      bufstream: bufstream,
      awaits: awaits
    });
  };

  Netbufs.prototype.fromObject = Struct.prototype.fromObject;

  Netbufs.prototype.initialize = function() {
    this.opts = {};
    this.awaits = [];
  };

  Netbufs.prototype.monitor = function() {
    this.bufstream.on('data', this.onData.bind(this));
    this.bufstream.on('end', this.onEnd.bind(this));
    this.bufstream.on('error', this.onError.bind(this));
    return this;
  };

  Netbufs.prototype.send = function(buf) {
    return new Promise(function(resolve, reject) {
      this.bufstream.write(buf, resolve);
    }.bind(this));
  };

  Netbufs.prototype.buffers = function*() {
    while (this.bufstream) {
      yield new Promise(function(resolve, reject) {
        this.awaits.push({
          resolve: resolve,
          reject: reject
        });
      }.bind(this));
    }
  };

  Netbufs.prototype.onData = function(buf) {
    this.awaits.forEach(function(await) {
      await.resolve(buf);
    });
    this.awaits = [];
    return this;
  };

  Netbufs.prototype.onEnd = function() {
    delete this.bufstream;
    return this;
  };

  Netbufs.prototype.onError = function(error) {
    this.awaits.forEach(function(await) {
      await.reject(error);
    });
    this.awaits = [];
    this.close();
    return this;
  };

  Netbufs.prototype.close = function() {
    this.bufstream.destroy();
    delete this.bufstream;
    this.awaits.forEach(function(await) {
      await.reject(new Error('netbufs closed while buffer awaits outstanding'));
    });
    this.awaits = [];
    return Promise.resolve();
  };

  return Netbufs;
}

inject = require('./injector')(inject, dependencies);
let Netbufs = inject();
module.exports = Netbufs;
