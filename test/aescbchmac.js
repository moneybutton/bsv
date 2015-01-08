var ACH = require('../lib/aescbchmac');
var should = require('chai').should();

describe('AESCBCHMAC', function() {
  
  describe('@encryptCipherkey', function() {
    
    it('should encrypt data', function() {
      var data = new Buffer([0]);
      var cipherkey = new Buffer(256 / 8);
      cipherkey.fill(0x12);
      var encbuf = ACH.encryptCipherkey(data, cipherkey);
      encbuf.length.should.equal(256 / 8 + 256 / 8);
    });

  });

  describe('@decryptCipherkey', function() {
    
    it('should decrypt data', function() {
      var encbuf = new Buffer('7519aff134f4fd273b41e50e6b9fac4d39b42afe6c2335551a4c06c4bdf9198d667b0dd26e935fdd5454e99ab27d8c17404199c79cb0c9d3884d2bd5bbd2b619', 'hex');
      var cipherkey = new Buffer(256 / 8);
      cipherkey.fill(0x12);
      var data = ACH.decryptCipherkey(encbuf, cipherkey);
      data.toString('hex').should.equal('00');
    });

  });

});
