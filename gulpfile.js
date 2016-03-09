'use strict'
let gulp = require('gulp')
let karma = require('gulp-karma')
let mocha = require('gulp-mocha')
let path = require('path')
let fs = require('fs')
let browserify = require('browserify')
let babelify = require('babelify')
let envify = require('envify')
let uglifyify = require('uglifyify')
let glob = require('glob')
require('./config')

gulp.task('build-bundle', function () {
  return new Promise(function (resolve, reject) {
    browserify({debug: false})
      // The babel polyfill is include once in the main bundle, and no where
      // else. You must include the main bundle in any HTML that uses fullnode,
      // since the pollyfill must be required exactly once. If you build things
      // yourself with babel, you will need to be sure to include the polyfill
      // exactly once yourself.
      .add(require.resolve('babel-polyfill'))
      .transform(envify)
      .transform(babelify.configure({presets: ['es2015']}))
      .add(require.resolve('./index.js'), {entry: true})
      .bundle()
      .on('error', reject)
      .on('end', resolve)
      .pipe(fs.createWriteStream(path.join(__dirname, 'build', process.env.FULLNODE_JS_BUNDLE_FILE)))
  })
})

gulp.task('build-worker', ['build-bundle'], function () {
  return new Promise(function (resolve, reject) {
    browserify({debug: false})
      .transform(envify)
      .transform(babelify.configure({ignore: /node_modules/, presets: ['es2015']}))
      .require(require.resolve('./lib/worker-browser.js'), {entry: true})
      .bundle()
      .on('error', reject)
      .on('end', resolve)
      .pipe(fs.createWriteStream(path.join(__dirname, 'build', process.env.FULLNODE_JS_WORKER_FILE)))
  })
})

gulp.task('build-bundle-min', ['build-worker'], function () {
  return new Promise(function (resolve, reject) {
    browserify({debug: false})
      .add(require.resolve('babel-polyfill'))
      .transform(envify)
      .transform(babelify.configure({ignore: /node_modules/, presets: ['es2015']}))
      .transform(uglifyify)
      .require(require.resolve('./index.js'), {entry: true})
      .bundle()
      .on('error', reject)
      .on('end', resolve)
      .pipe(fs.createWriteStream(path.join(__dirname, 'build', process.env.FULLNODE_JS_BUNDLE_MIN_FILE)))
  })
})

gulp.task('build-worker-min', ['build-bundle-min'], function () {
  return new Promise(function (resolve, reject) {
    browserify({debug: false})
      .transform(envify)
      .transform(babelify.configure({ignore: /node_modules/, presets: ['es2015']}))
      .transform(uglifyify)
      .require(require.resolve('./lib/worker-browser.js'), {entry: true})
      .bundle()
      .on('error', reject)
      .on('end', resolve)
      .pipe(fs.createWriteStream(path.join(__dirname, 'build', process.env.FULLNODE_JS_WORKER_MIN_FILE)))
  })
})

gulp.task('build-tests', ['build-worker'], function () {
  return new Promise(function (resolve, reject) {
    glob('./test/**/*.js', {}, function (err, files) {
      if (err) {
        reject(err)
        return
      }
      let b = browserify({debug: true})
        .transform(envify)
        .transform(babelify.configure({ignore: /node_modules/, presets: ['es2015']}))
      for (let file of files) {
        b.add(file)
      }
      b.bundle()
        .on('error', reject)
        .on('end', resolve)
        .pipe(fs.createWriteStream(path.join(__dirname, 'build', 'tests.js')))
    })
  })
})

gulp.task('test-node', function () {
  return gulp.src(['test/*.js'])
    .pipe(mocha({reporter: 'dot'}))
    .once('error', function (error) { // eslint-disable-line
      process.exit(1)
    })
})

gulp.task('build-karma-url', function () {
  // karma serves static files, including js files, from /base/
  process.env.FULLNODE_JS_BASE_URL = '/base/'
})

gulp.task('build-karma', ['build-karma-url', 'build-tests'])

gulp.task('test-karma', ['build-karma'], function () {
  let server = require(path.join(__dirname, 'bin', 'testapp')).server // runs the PeerJS server
  return gulp.src([])
    .pipe(karma({
      configFile: '.karma.conf.js',
      action: 'run'
    }))
    .on('error', function (err) {
      throw err
    })
    .on('end', function () {
      server.close()
      process.exit()
    })
})

gulp.task('test-browser', ['build-karma', 'test-karma'])
gulp.task('test', ['test-node'])
gulp.task('build', ['build-bundle', 'build-worker', 'build-bundle-min', 'build-worker-min', 'build-tests'])
gulp.task('default', ['build'])
