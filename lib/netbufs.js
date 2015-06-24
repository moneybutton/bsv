if (process.browser)
  module.exports = require('./netbufs-browser');
else
  module.exports = require('./netbufs-node');
