/**
 * Worker
 * ======
 *
 * This class is for running CPU-heavy, blocking operations. It either runs in
 * a separate process (in node), or in a web worker thread (in a browser). It
 * receives messages from outside, performs the computation, and then sends
 * back the result. You probably don't want to use this file directly, but
 * rather Work, which will automatically spawn workers if necessary and send
 * commands to them. Note that the source code for worker-node and
 * worker-browser are almost equivalent, except for code that manages the
 * differences at the bottom. This is done deliberately, so that the browser
 * version can be minimized properly.
 */
'use strict'

// The fullnode "classes" that the worker can access. Objects sent from the
// main process/thread must be one of these types. They are defined below in a
// different way for node and the browser.
let classes

// The function to send data back to the main process/thread. This is different
// for node and browsers and thus is defined below.
let send

/**
 * The generic "receive data" method that works both in node and the browser.
 * It reconstitutes the data into an object of class classname, and then runs
 * the method methodname on it with arguments args.
 */
function receive (buf) {
  let WorkersCmd = classes['WorkersCmd']
  let WorkersResult = classes['WorkersResult']
  let obj, result, id
  try {
    let workersCmd = WorkersCmd().fromFastBuffer(buf, classes)
    id = workersCmd.id
    if (workersCmd.isobj) {
      obj = classes[workersCmd.classname]().fromFastBuffer(workersCmd.objbuf)
    } else {
      obj = classes[workersCmd.classname]
    }
    result = obj[workersCmd.methodname].apply(obj, workersCmd.args)
  } catch (error) {
    if (!id) {
      id = 0 // must be uint
    }
    let workersResult = WorkersResult().fromError(error, id)
    send(workersResult.toFastBuffer())
    return
  }
  let workersResult = WorkersResult().fromResult(result, id)
  send(workersResult.toFastBuffer())
}

// Node uses process.on and process.send to receive and send messages.
classes = require('../index')
process.stdin.on('data', function (buf) {
  return receive(buf)
})
send = process.stdout.write.bind(process.stdout)
