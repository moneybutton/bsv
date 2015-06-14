"use strict";
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
