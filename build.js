"use strict";

let path = require('path');
let fs = require('fs');
let browserify = require('browserify');
let es6ify = require('es6ify');
let uglifyify = require('uglifyify');
let glob = require('glob');
let fullPath = path.join(__dirname, 'browser', 'fullnode.js');
let minPath = path.join(__dirname, 'browser', 'fullnode-min.js');
let testPath = path.join(__dirname, 'browser', 'tests.js');

// fullnode.js
browserify({debug: false})
.add(es6ify.runtime)
.transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
.require(require.resolve('./index.js'), {entry: true})
.bundle()
.on('error', function (err) { console.error(err); })
.pipe(fs.createWriteStream(fullPath));

// fullnode-min.js
browserify({debug: false})
.add(es6ify.runtime)
.transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
.transform(uglifyify)
.require(require.resolve('./index.js'), {entry: true})
.bundle()
.on('error', function (err) { console.error(err); })
.pipe(fs.createWriteStream(minPath));

// tests
glob("./test/**/*.js", {}, function (err, files) {
  let b = browserify({debug: true})
  .add(es6ify.runtime)
  .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
  for (let file of files) {
    b.add(file);
  }
  b.bundle()
  .on('error', function (err) { console.error(err); })
  .pipe(fs.createWriteStream(testPath));
});
