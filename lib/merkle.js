var Hash = require('./hash');

var Merkle = function Merkle(leaves, hashbuf, hashname) {
  if (!(this instanceof Merkle))
    return new Merkle(leaves, hashbuf, hashname);
  if (leaves && hashbuf) {
    this.set({
      leaves: leaves,
      hashbuf: hashbuf,
      hashname: hashname
    });
  } else if (leaves) {
    var obj = leaves;
    this.set(obj);
  }
};

Merkle.prototype.set = function(obj) {
  this.leaves = obj.leaves || this.leaves;
  this.hashbuf = obj.hashbuf || this.hashbuf;
  this.hashname = obj.hashname || this.hashname || 'sha256sha256';
  return this;
};
