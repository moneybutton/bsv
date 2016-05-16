/* global self */
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
  Worker: !process.browser ? require('child_process').spawn : self.Worker,
  WorkersCmd: require('./workers-cmd'),
  WorkersResult: require('./workers-result'),
  path: !process.browser ? require('path') : undefined
}

let inject = function (deps) {
  let Worker = deps.Worker
  let WorkersCmd = deps.WorkersCmd
  let WorkersResult = deps.WorkersResult
  let path = deps.path

  let globalWorkers

  class Workers {
    constructor (nativeWorkers = [], lastid = 0, promisemap = new Map()) {
      this.nativeWorkers = nativeWorkers
      this.lastid = lastid
      this.promisemap = promisemap
    }

    spawnBrowser () {
      // TODO: Support more than one worker
      this.nativeWorkers[0] = new Worker(process.env.YOURS_BITCOIN_JS_BASE_URL + process.env.YOURS_BITCOIN_JS_WORKER_FILE)
      this.handleBrowser()
      return this
    }

    handleBrowser () {
      this.nativeWorkers[0].onerror = function (event) {
        this.onError(event.message + ': ' + event.filename + ':' + event.lineno)
      }.bind(this)
      this.nativeWorkers[0].onmessage = function (event) {
        this.onStdoutData(new Buffer(event.data))
      }.bind(this)
      return this
    }

    spawnNode () {
      // TODO: Support more than one worker
      // TODO: {maxBuffer: 1000*1024}
      this.nativeWorkers[0] = Worker('node', [path.join(__dirname, 'worker-node.js')])
      this.handleNode()
      return this
    }

    handleNode () {
      this.nativeWorkers[0].on('error', (error) => {
        this.onError(error)
      })
      this.nativeWorkers[0].on('exit', () => {
        this.onError('unexpected exit')
      })
      this.nativeWorkers[0].on('close', () => {
        this.onError('unexpected close')
      })
      this.nativeWorkers[0].on('disconnect', () => {
        this.onError('unexpected disconnect')
      })
      this.nativeWorkers[0].stdout.on('data', (buf) => {
        this.onStdoutData(buf)
      })
      return this
    }

    onStdoutData (buf) {
      let workersResult = new WorkersResult().fromFastBuffer(buf)
      return this.onResult(workersResult)
    }

    onResult (workersResult) {
      if (!workersResult.isError) {
        let resolve = this.promisemap.get(workersResult.id).resolve
        resolve(workersResult)
      } else {
        let error = new Error(JSON.parse(workersResult.resbuf.toString()))
        let reject = this.promisemap.get(workersResult.id).reject
        reject(error)
      }
      this.promisemap.delete(workersResult.id)
      return this
    }

    onError (error) { // eslint-disable-line
      return this
    }

    spawn () {
      if (globalWorkers) {
        console.log('Warning: Spooling up non-global workers.')
      }
      if (process.browser) {
        return this.spawnBrowser()
      } else {
        return this.spawnNode()
      }
    }

    sendBuffer (buf) {
      let buflen = new Buffer(4)
      buflen.writeUInt32BE(buf.length)
      buf = Buffer.concat([buflen, buf])
      if (process.browser) {
        this.nativeWorkers[0].postMessage(buf)
      } else {
        this.nativeWorkers[0].stdin.write(buf)
      }
      return this
    }

    asyncObjectMethod (obj, methodname, args, id) {
      if (!args) {
        throw new Error('must specify args')
      }
      id = id !== undefined ? id : ++this.lastid
      let workersCmd = new WorkersCmd().fromObjectMethod(obj, methodname, args, id)
      let buf = workersCmd.toFastBuffer()
      return new Promise((resolve, reject) => {
        this.sendBuffer(buf)
        this.promisemap.set(id, {
          resolve: resolve,
          reject: reject
        })
      })
    }

    static asyncObjectMethod (obj, methodname, args, id) {
      if (!globalWorkers) {
        globalWorkers = new Workers().spawn()
      }
      return globalWorkers.asyncObjectMethod(obj, methodname, args, id)
    }

    asyncClassMethod (classname, methodname, args, id) {
      if (!args) {
        throw new Error('must specify args')
      }
      id = id !== undefined ? id : ++this.lastid
      let workersCmd = new WorkersCmd().fromClassMethod(classname, methodname, args, id)
      let buf = workersCmd.toFastBuffer()
      return new Promise(function (resolve, reject) {
        this.sendBuffer(buf)
        this.promisemap.set(id, {
          resolve: resolve,
          reject: reject
        })
      }.bind(this))
    }

    static asyncClassMethod (obj, methodname, args, id) {
      if (!globalWorkers) {
        globalWorkers = new Workers().spawn()
      }
      return globalWorkers.asyncClassMethod(obj, methodname, args, id)
    }

    static endGlobalWorkers () {
      if (globalWorkers && !process.browser) {
        // TODO: Support multiple workers.
        globalWorkers.nativeWorkers[0].kill('SIGINT')
        globalWorkers = undefined
      }
    }
  }

  return Workers
}

inject = require('injecter')(inject, dependencies)
let Workers = inject()
module.exports = Workers
