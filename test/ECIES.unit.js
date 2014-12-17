var assert = require('assert');
var ECIES = require('../');

var bitcore = require('bitcore');
var PrivateKey = bitcore.PrivateKey;

var aliceKey = new PrivateKey('L1Ejc5dAigm5XrM3mNptMEsNnHzS7s51YxU7J61ewGshZTKkbmzJ');
var bobKey   = new PrivateKey('KxfxrUXSMjJQcb3JgnaaA6MqsrKQ1nBSxvhuigdKRyFiEm6BZDgG');

describe('ECIES', function() {
  
  it('should provide a constructor', function() {
    assert.equal( typeof ECIES , 'function' ); 
  });
  
  it('should successfully construct an instance', function() {
    var ecies = new ECIES();
    assert.ok( ecies instanceof ECIES );
  });
  
  it('should not require the "new" keyword', function() {
    var ecies = ECIES();
    assert.ok( ecies instanceof ECIES );
  });
  
  it('should be a chainable function', function() {
    var ecies = ECIES()
      .privateKey( aliceKey )
      .publicKey( bobKey.publicKey );

    assert.ok( ecies instanceof ECIES );

  });
  
  it('should correctly encrypt a message', function() {
    var alice = ECIES()
      .privateKey( aliceKey )
      .publicKey( bobKey.publicKey );
    
    var message = 'attack at dawn';

    var encrypted = alice.encrypt( message );

    assert.ok( encrypted instanceof Buffer );
    
  });
  
  it('should correctly decrypt a message', function() {
    var bob = ECIES()
      .privateKey( bobKey )
      .publicKey( aliceKey.publicKey );

    var encrypted = '0339e504d6492b082da96e11e8f039796b06cd4855c101e2492a6f10f3e056a9e7499368e41313fa48f71759d13469c28b0bd6ff03a08b2ae5e6679e848f92db4b26a8ccf9c0b43f16eae6216c36380f70724743fe9053c98d94281aa74c94df40';
    var predicted = 'attack at dawn';
    
    var encBuf = new Buffer( encrypted , 'hex');
    
    var decrypted = bob
      .decrypt( encBuf )
      .toString();

    assert.equal( decrypted , predicted ); 
  });
  
});
