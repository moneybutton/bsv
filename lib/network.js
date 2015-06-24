if (process.browser)
  module.exports = require('./network-browser');
else
  module.exports = require('./network-node');
