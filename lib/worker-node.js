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
"use strict";

// The fullnode "classes" that the worker can access. Objects sent from the
// main process/thread must be one of these types. They are defined below in a
// different way for node and the browser.
let classes;

// The function to send data back to the main process/thread. This is different
// for node and browsers and thus is defined below.
let send;

/**
 * The generic "receive data" method that works both in node and the browser.
 * It reconstitutes the data into an object of class classname, and then runs
 * the method methodname on it with arguments args.
 */
function receive(data) {
  let obj, result;
  try {
    obj = classes[data.classname]().fromBuffer(data.objbuf);
    result = obj[data.methodname].apply(obj, data.args);
  } catch (error) {
    send({
      id: data.id,
      error: error.toString()
    });
    return;
  }
  send({
    id: data.id,
    result: result
  });
};

// Node uses process.on and process.send to receive and send messages.
classes = {
  Msg: require('./msg')
};
process.on('message', function(data) {
  data.objbuf = new Buffer(data.objbuf);
  return receive(data);
});
send = process.send.bind(process);
