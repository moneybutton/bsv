if (process.browser)
  module.exports = require('./channel-browser');
else
  module.exports = require('./channel-node');
