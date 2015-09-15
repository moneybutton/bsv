/**
 * Work
 * ====
 *
 * A convenient interface for giving some computationally heavy work to some
 * workers, which are either processes or threads. In node we use processes,
 * and in browsers we use threads. The .buffer() method will return a promise
 * that is fulfilled when the computation is done. The typical way to use this
 * is:
 *
 * Work(obj, 'name of a method on the object', []).buffer()
 * .then(function(result)
 *   ...
 * })
 *
 * It only works with the main fullnode classes and not on arbitrary objects.
 */
'use strict'
let dependencies = {
  fork: require('child_process').fork,
  path: require('path'),
  Struct: require('./struct'),
  Workers: require('./workers')
}

function inject (deps) {
  let fork = deps.fork
  let path = deps.path
  let Struct = deps.Struct
  let Workers = deps.Workers

  function Work (obj, methodname, args, workers) {
    if (!(this instanceof Work))
      return new Work(obj, methodname, args, workers)
    this.fromObject({
      obj: obj,
      methodname: methodname,
      args: args,
      workers: workers
    })
  }

  Work.prototype.fromObject = Struct.prototype.fromObject

  Work.prototype.checkspawn = function () {
    if (!this.hasOwnProperty('workers')) {
      if (!this.workers) {
        Work.prototype.workers = Workers().spawn()
      }
    }
  }

  Work.prototype.buffer = function (id) {
    this.checkspawn()
    return this.workers.send({
      objbuf: this.obj.toBuffer(),
      classname: this.obj.constructor.name,
      methodname: this.methodname,
      args: this.args,
      id: id
    })
  }

  Work.prototype.buffers = function (id) {
    throw new Error('not implemented yet')
  }

  return Work
}

inject = require('./injector')(inject, dependencies)
let Work = inject()
module.exports = Work
