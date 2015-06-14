/**
 * Workers
 * =======
 *
 * Workers manages either processes (in node) or threads (in a browser). The
 * workers are intended to handle CPU-heavy tasks that block IO. This class is
 * a little unusual in that it must use different interfaces whether in node or
 * in the browser. In node, we use node's build-in child_process fork to create
 * new workers we can communicate with. In the browser, we use web workers.
 * Unfortunately, node and web browsers do not have a common interface for
 * workers. There is a node module called webworker-threads for node that
 * mimics the browser's web workers, but unfortunately it does not support
 * require(), and thus isn't very useful in our case. Therefore we fall back to
 * process forks.
 */
"use strict";
let dependencies = {
  extend: require('../extend'),
  path: !process.browser ? require('path') : undefined,
  Struct: require('../struct'),
  Worker: !process.browser ? require('child_process').fork : Worker,
};

function inject(deps) {
  let extend = deps.extend;
  let path = deps.path;
  let Struct = deps.Struct;
  let Worker = deps.Worker;

  let worker;

  function Workers(workers, lastid, promisemap) {
    if (!(this instanceof Workers))
      return new Workers(workers, lastid, promisemap);
    this.initialize();
    this.fromObject({
      workers: workers,
      lastid: lastid,
      promisemap: promisemap
    });
  }

  Workers.prototype.fromObject = Struct.prototype.fromObject;

  Workers.prototype.initialize = function() {
    this.lastid = 0;
    this.workers = [];
    this.promisemap = new Map();
  };

  Workers.prototype.spawnBrowser = function() {
    worker = new Worker(process.env.FULLNODE_JS_BASE_URL + process.env.FULLNODE_JS_WORKER_FILE);
    this.workers[0] = worker;

    worker.onmessage = function(event) {
      let resolve = this.promisemap.get(event.data.id).resolve;
      let reject = this.promisemap.get(event.data.id).reject;
      if (!event.data.error) {
        resolve(event.data.result);
      } else {
        reject(event.data.error);
      }
      this.promisemap.delete(event.data.id);
    }.bind(this);

    return this;
  };

  Workers.prototype.spawnNode = function() {
    worker = Worker(path.join(__dirname, 'worker.js'));
    this.workers[0] = worker;

    worker.on('error', function(err) {
      // TODO: handle
    });

    worker.on('exit', function() {
      // TODO: handle
    });

    worker.on('close', function() {
      // TODO: handle
    });

    worker.on('disconnect', function() {
      // TODO: handle
    });

    worker.on('message', function(event) {
      let resolve = this.promisemap.get(event.id).resolve;
      let reject = this.promisemap.get(event.id).reject;
      if (!event.error) {
        resolve(event.result);
      } else {
        reject(event.error);
      }
      this.promisemap.delete(event.id);
    }.bind(this));

    return this;
  };

  if (process.browser) {
    Workers.prototype.spawn = Workers.prototype.spawnBrowser;
  } else {
    Workers.prototype.spawn = Workers.prototype.spawnNode;
  }

  Workers.prototype.send = function(event, id) {
    id = id !== undefined ? id : ++this.lastid;
    event = extend({}, event, {id: id});
    return new Promise(function(resolve, reject) {
      if (process.browser) {
        this.workers[0].postMessage(event);
      } else {
        this.workers[0].send(event);
      }
      this.promisemap.set(id, {
        resolve: resolve,
        reject: reject
      });
    }.bind(this));
  };

  return Workers;
}

inject = require('../injector')(inject, dependencies);
let Workers = inject();
module.exports = Workers;
