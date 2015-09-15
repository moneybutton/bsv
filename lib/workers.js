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
 *
 * You probably don't need to use this class directly. Use Work, which will
 * automatically spawn new workers if needed.
 */
'use strict'
let dependencies = {
  extend: require('./extend'),
  path: !process.browser ? require('path') : undefined,
  Struct: require('./struct'),
  Worker: !process.browser ? require('child_process').fork : self.Worker,
}

function inject (deps) {
  let extend = deps.extend
  let path = deps.path
  let Struct = deps.Struct
  let Worker = deps.Worker

  function Workers (workers, lastid, promisemap) {
    if (!(this instanceof Workers))
      return new Workers(workers, lastid, promisemap)
    this.initialize()
    this.fromObject({
      workers: workers,
      lastid: lastid,
      promisemap: promisemap
    })
  }

  Workers.prototype.fromObject = Struct.prototype.fromObject

  Workers.prototype.initialize = function () {
    this.lastid = 0
    this.workers = []
    this.promisemap = new Map()
    return this
  }

  Workers.prototype.spawnBrowser = function () {
    this.workers[0] = new Worker(process.env.FULLNODE_JS_BASE_URL + process.env.FULLNODE_JS_WORKER_FILE)
    this.handleBrowser()
    return this
  }

  Workers.prototype.handleBrowser = function () {
    this.workers[0].onerror = function (event) {
      this.onError(event.message + ': ' + event.filename + ':' + event.lineno)
    }.bind(this)
    this.workers[0].onmessage = function (event) {
      this.onResult(event.data)
    }.bind(this)
    return this
  }

  Workers.prototype.spawnNode = function () {
    this.workers[0] = Worker(path.join(__dirname, 'worker-node.js'))
    this.handleNode()
    return this
  }

  Workers.prototype.handleNode = function () {
    this.workers[0].on('error', function (error) {
      this.onError(error)
    }.bind(this))
    this.workers[0].on('exit', function () {
      this.onError('unexpected exit')
    }.bind(this))
    this.workers[0].on('close', function () {
      this.onError('unexpected close')
    }.bind(this))
    this.workers[0].on('disconnect', function () {
      this.onError('unexpected disconnect')
    }.bind(this))
    this.workers[0].on('message', function (event) {
      this.onResult(event)
    }.bind(this))
    return this
  }

  Workers.prototype.onResult = function (result) {
    let resolve = this.promisemap.get(result.id).resolve
    let reject = this.promisemap.get(result.id).reject
    if (!result.error) {
      resolve(result.result)
    } else {
      reject(result.error)
    }
    this.promisemap.delete(result.id)
    return this
  }

  Workers.prototype.onError = function (error) {
    return this
  }

  if (process.browser) {
    Workers.prototype.spawn = Workers.prototype.spawnBrowser
  } else {
    Workers.prototype.spawn = Workers.prototype.spawnNode
  }

  Workers.prototype.send = function (event, id) {
    id = id !== undefined ? id : ++this.lastid
    event = extend({}, event, {id: id})
    return new Promise(function (resolve, reject) {
      if (process.browser) {
        this.workers[0].postMessage(event)
      } else {
        this.workers[0].send(event)
      }
      this.promisemap.set(id, {
        resolve: resolve,
        reject: reject
      })
    }.bind(this))
    return this
  }

  return Workers
}

inject = require('./injector')(inject, dependencies)
let Workers = inject()
module.exports = Workers
