/**
 * Network Buffers (i.e., low-level network connection)
 * ====================================================
 *
 * An abstraction over network connection streams in node, and web RTC data
 * streams in the browser (see netchannel-browser).
 */
"use strict";
let dependencies = {
  Struct: require('./struct')
};

function inject(deps) {
  let Struct = deps.Struct;

  function Netchannel(opts, bufstream, awaits) {
    if (!(this instanceof Netchannel))
      return new Netchannel(opts, bufstream, awaits);
    this.initialize();
    this.fromObject({
      opts: opts,
      bufstream: bufstream,
      awaits: awaits
    });
  };

  Netchannel.prototype.fromObject = Struct.prototype.fromObject;

  Netchannel.prototype.initialize = function() {
    this.opts = {};
    this.awaits = [];
  };

  Netchannel.prototype.monitor = function() {
    this.bufstream.on('data', this.onData.bind(this));
    this.bufstream.on('end', this.onEnd.bind(this));
    this.bufstream.on('error', this.onError.bind(this));
    return this;
  };

  Netchannel.prototype.send = function(buf) {
    return new Promise(function(resolve, reject) {
      this.bufstream.write(buf, resolve);
    }.bind(this));
  };

  Netchannel.prototype.awaitBuffers = function*() {
    while (this.bufstream) {
      yield new Promise(function(resolve, reject) {
        this.awaits.push({
          resolve: resolve,
          reject: reject
        });
      }.bind(this));
    }
  };

  Netchannel.prototype.onData = function(buf) {
    this.awaits.forEach(function(await) {
      await.resolve(buf);
    });
    this.awaits = [];
    return this;
  };

  Netchannel.prototype.onEnd = function() {
    delete this.bufstream;
    return this;
  };

  Netchannel.prototype.onError = function(error) {
    this.awaits.forEach(function(await) {
      await.reject(error);
    });
    this.awaits = [];
    this.close();
    return this;
  };

  Netchannel.prototype.close = function() {
    this.bufstream.destroy();
    delete this.bufstream;
    this.awaits.forEach(function(await) {
      await.reject(new Error('netchannel closed while buffer awaits outstanding'));
    });
    this.awaits = [];
    return Promise.resolve();
  };

  return Netchannel;
}

inject = require('./injector')(inject, dependencies);
let Netchannel = inject();
module.exports = Netchannel;
