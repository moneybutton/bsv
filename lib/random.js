var crypto = require('crypto');

var Random = {};

Random.getRandomBuffer = function(size) {
  return crypto.randomBytes(size);
}

module.exports = Random;
