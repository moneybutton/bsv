if (process.browser)
  module.exports = require('./netchannel-browser');
else
  module.exports = require('./netchannel-node');
