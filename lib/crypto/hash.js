if (process.browser) module.exports = require('./hash.browser')
else module.exports = require('./hash.node')
