/**
 * Worker
 * ======
 *
 * This code either runs in a separate process in node, or in a web worker
 * thread in a browser. It receives messages from outside, performs the
 * computation, and then sends back the result.
 */
"use strict";
if (process.browser)  {
  importScripts(process.env.FULLNODE_JS_BASE_URL + process.env.FULLNODE_JS_BUNDLE_FILE);

  onmessage = function(event) {
    let objbuf, obj, result;
    let classes = fullnode;
    let data = event.data;
    try {
      objbuf = new fullnode.deps.Buffer(data.objbuf);
      obj = classes[data.classname]().fromBuffer(objbuf);
      result = obj[data.methodname].apply(obj, data.args);
    } catch (error) {
      postMessage({
        id: data.id,
        error: error.toString()
      });
      return;
    }
    postMessage({
      id: data.id,
      result: result
    });
  };
} else {
  let classes = {
    Msg: require('./msg')
  };
   
  process.on('message', function(data) {
    let objbuf, obj, result;
    try {
      objbuf = new Buffer(data.objbuf);
      obj = classes[data.classname]().fromBuffer(objbuf);
      result = obj[data.methodname].apply(obj, data.args);
    } catch (error) {
      process.send({
        id: data.id,
        error: error
      });
      return;
    }
    process.send({
      id: data.id,
      result: result
    });
  });
}
