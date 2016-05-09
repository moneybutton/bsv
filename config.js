// By default, we assume browser-loaded javascript is served from the root
// directory, "/", of the http server. karma, however, assumes files are in the
// "/base/" directory, thus we invented this variable to allow overriding the
// directory. If you wish to put your javascript somewhere other than root,
// specify it by setting this environment variable before building. You can
// also override the name of the bundle and worker files or the minified
// versions by setting the respective environment variables below.
if (!process.env.YOURS_BITCOIN_JS_BASE_URL) {
  process.env.YOURS_BITCOIN_JS_BASE_URL = '/'
}

if (!process.env.YOURS_BITCOIN_JS_BUNDLE_FILE) {
  process.env.YOURS_BITCOIN_JS_BUNDLE_FILE = 'yours-bitcoin.js'
}

if (!process.env.YOURS_BITCOIN_JS_WORKER_FILE) {
  process.env.YOURS_BITCOIN_JS_WORKER_FILE = 'yours-bitcoin-worker.js'
}

if (!process.env.YOURS_BITCOIN_JS_BUNDLE_MIN_FILE) {
  process.env.YOURS_BITCOIN_JS_BUNDLE_MIN_FILE = 'yours-bitcoin-min.js'
}

if (!process.env.YOURS_BITCOIN_JS_WORKER_MIN_FILE) {
  process.env.YOURS_BITCOIN_JS_WORKER_MIN_FILE = 'yours-bitcoin-worker-min.js'
}

if (!process.env.YOURS_BITCOIN_NETWORK) {
  process.env.YOURS_BITCOIN_NETWORK = 'mainnet'
}
