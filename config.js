// By default, we assume browser-loaded javascript is served from the root
// directory, "/", of the http server. karma, however, assumes files are in the
// "/base/" directory, thus we invented this variable to allow overriding the
// directory. If you wish to put your javascript somewhere other than root,
// specify it by setting this environment variable before building. You can
// also override the name of the bundle and worker files or the minified
// versions by setting the respective environment variables below.
if (!process.env.FULLNODE_JS_BASE_URL) {
  process.env.FULLNODE_JS_BASE_URL = '/'
}

if (!process.env.FULLNODE_JS_BUNDLE_FILE) {
  process.env.FULLNODE_JS_BUNDLE_FILE = 'fullnode.js'
}

if (!process.env.FULLNODE_JS_WORKER_FILE) {
  process.env.FULLNODE_JS_WORKER_FILE = 'fullnode-worker.js'
}

if (!process.env.FULLNODE_JS_BUNDLE_MIN_FILE) {
  process.env.FULLNODE_JS_BUNDLE_MIN_FILE = 'fullnode-min.js'
}

if (!process.env.FULLNODE_JS_WORKER_MIN_FILE) {
  process.env.FULLNODE_JS_WORKER_MIN_FILE = 'fullnode-worker-min.js'
}

if (!process.env.FULLNODE_NETWORK) {
  process.env.FULLNODE_NETWORK = 'mainnet'
}
