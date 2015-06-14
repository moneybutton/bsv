/**
 * Basic web app to facilitate running the mocha browser tests without karma.
 */
"use strict";
let express = require('express');
let app = express();

app.use(express.static('browser'));
app.use(express.static('node_modules'));

let server = app.listen(3000, function () {

  let host = server.address().address;
  let port = server.address().port;

  console.log('Run the mocha tests at http://%s:%s/', host, port);

});
