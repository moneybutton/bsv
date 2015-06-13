"use strict";
let classes = {
  Msg: require('../msg')
};
 
process.on('message', function(data) {
  let objbuf, obj, result;
  try {
    objbuf = new Buffer(data.objbuf);
    obj = classes[data.class]().fromBuffer(objbuf);
    result = obj[data.method].apply(obj, data.args);
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
