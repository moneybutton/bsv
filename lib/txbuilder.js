/**
 * Transaction Builder. This is a, yet unfinished, convenience class for
 * building pubkeyhash and p2sh transactions. You can pay to pubkeyhash to p2sh
 * and can spend pubkeyhash or p2sh-pubkeyhash or p2sh-multisig.
 */
var Tx = require('./tx');
var Address = require('./address');
var BN = require('./bn');

var Txbuilder = function Txbuilder(obj) {
  if (!(this instanceof Txbuilder))
    return new Txbuilder(obj);
  if (obj) {
    this.initialize();
    this.set(obj);
  } else {
    this.initialize();
  }
};

module.exports = Txbuilder;

Txbuilder.prototype.initialize = function() {
  this.tx = Tx();
  this.inputmap = {};
  this.toaddr = Address();
  this.changeaddr = Address();
  this.valuebn = BN();
  this.feebn = BN();
  return this;
};

Txbuilder.prototype.set = function(obj) {
  this.tx = obj.tx || this.tx;
  this.inputmap = obj.inputmap || this.inputmap;
  this.toaddr = obj.toaddr || this.toaddr;
  this.changeaddr = obj.changeaddr || this.changeaddr;
  this.valuebn = obj.valuebn || this.changebn;
  this.feebn = obj.feebn || this.feebn;
  return this;
};
