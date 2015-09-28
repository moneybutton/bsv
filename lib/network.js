if (process.browser) {
  module.exports = require('./network-peerjs')
} else {
  module.exports = require('./network-tcp')
}
