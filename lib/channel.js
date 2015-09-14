if (process.browser) {
  module.exports = require('./channel-peerjs');
} else {
  module.exports = require('./channel-tcp');
}
