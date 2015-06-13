/**
 * For building the default browser bundles and tests.
 */
"use strict";

let path = require('path');
let fs = require('fs');
let browserify = require('browserify');
let es6ify = require('es6ify');
let envify = require('envify');
let uglifyify = require('uglifyify');
let glob = require('glob');

// By default, we assume browser-loaded javascript is served from the root
// directory, "/", of the http server. karma, however, assumes files are in the
// "/base/" directory, thus we invented this variable to allow overriding the
// directory. If you wish to put your javascript somewhere other than root,
// specify it by setting this environment variable before building. You can
// also override the name of the bundle and worker files or the minified
// versions by setting the respective environment variables below.
if (!process.env.FULLNODE_JS_BASE_URL) {
  process.env.FULLNODE_JS_BASE_URL = '/';
}

if (!process.env.FULLNODE_JS_BUNDLE_FILE) {
  process.env.FULLNODE_JS_BUNDLE_FILE = 'fullnode.js';
}

if (!process.env.FULLNODE_JS_WORKER_FILE) {
  process.env.FULLNODE_JS_WORKER_FILE = 'fullnode-worker.js';
}

if (!process.env.FULLNODE_JS_BUNDLE_MIN_FILE) {
  process.env.FULLNODE_JS_BUNDLE_MIN_FILE = 'fullnode-min.js';
}

if (!process.env.FULLNODE_JS_WORKER_MIN_FILE) {
  process.env.FULLNODE_JS_WORKER_MIN_FILE = 'fullnode-worker-min.js';
}

return new Promise(function(resolve, reject) {
  console.log(process.env.FULLNODE_JS_BUNDLE_FILE);
  browserify({debug: false})
  .add(es6ify.runtime)
  .transform(envify)
  .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
  .require(require.resolve('./index.js'), {entry: true})
  .bundle()
  .on('error', function(err) {reject(err);})
  .on('end', function() {resolve();})
  .pipe(fs.createWriteStream(path.join(__dirname, 'browser', process.env.FULLNODE_JS_BUNDLE_FILE)));
})
.then(function() {
  return new Promise(function(resolve, reject) {
    console.log(process.env.FULLNODE_JS_WORKER_FILE);
    browserify({debug: false})
    //.add(es6ify.runtime)
    .transform(envify)
    .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
    .require(require.resolve('./lib/work/worker-browser.js'), {entry: true})
    .bundle()
    .on('error', function (err) { console.error(err); })
    .on('end', function() {resolve();})
    .pipe(fs.createWriteStream(path.join(__dirname, 'browser', process.env.FULLNODE_JS_WORKER_FILE)));
  });
})
.then(function() {
  return new Promise(function(resolve, reject) {
    let backup = process.env.FULLNODE_JS_BUNDLE_FILE;
    process.env.FULLNODE_JS_BUNDLE_FILE = process.env.FULLNODE_JS_BUNDLE_MIN_FILE;
    console.log(process.env.FULLNODE_JS_BUNDLE_FILE);
    browserify({debug: false})
    .add(es6ify.runtime)
    .transform(envify)
    .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
    .transform(uglifyify)
    .require(require.resolve('./index.js'), {entry: true})
    .bundle()
    .on('error', function(err) {reject(err);})
    .on('end', function() {process.env.FULLNODE_JS_BUNDLE_FILE = backup; resolve();})
    .pipe(fs.createWriteStream(path.join(__dirname, 'browser', process.env.FULLNODE_JS_BUNDLE_FILE)));
  })
})
.then(function() {
  return new Promise(function(resolve, reject) {
    let backup = process.env.FULLNODE_JS_WORKER_FILE;
    process.env.FULLNODE_JS_WORKER_FILE = process.env.FULLNODE_JS_WORKER_MIN_FILE;
    console.log(process.env.FULLNODE_JS_WORKER_FILE);
    browserify({debug: false})
    //.add(es6ify.runtime)
    .transform(envify)
    .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
    .require(require.resolve('./lib/work/worker-browser.js'), {entry: true})
    .bundle()
    .on('error', function(err) {reject(err);})
    .on('end', function() {process.env.FULLNODE_JS_WORKER_FILE = backup; resolve();})
    .pipe(fs.createWriteStream(path.join(__dirname, 'browser', process.env.FULLNODE_JS_WORKER_FILE)));
  })
})
.then(function() {
  return new Promise(function(resolve, reject) {
    console.log('tests.js');
    glob("./test/**/*.js", {}, function (err, files) {
      let b = browserify({debug: true})
      .add(es6ify.runtime)
      .transform(envify)
      .transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/));
      for (let file of files) {
        b.add(file);
      }
      b.bundle()
      .on('error', function(err) {reject(err);})
      .on('end', function() {resolve();})
      .pipe(fs.createWriteStream(path.join(__dirname, 'browser', 'tests.js')));
    });
  });
});
