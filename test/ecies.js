'use strict';

var ECIES = require('../');

var should = require('chai').should();
var bitcore = require('bitcore');
var PrivateKey = bitcore.PrivateKey;



var aliceKey = new PrivateKey('L1Ejc5dAigm5XrM3mNptMEsNnHzS7s51YxU7J61ewGshZTKkbmzJ');
var bobKey = new PrivateKey('KxfxrUXSMjJQcb3JgnaaA6MqsrKQ1nBSxvhuigdKRyFiEm6BZDgG');

describe('ECIES', function() {

  it('constructor', function() {
    (typeof ECIES).should.equal('function');
  });

  it('constructs an instance', function() {
    var ecies = new ECIES();
    (ecies instanceof ECIES).should.equal(true);
  });

  it('doesnt require the "new" keyword', function() {
    var ecies = ECIES();
    (ecies instanceof ECIES).should.equal(true);
  });

  it('privateKey fails with no argument', function() {
    var ecies = ECIES();
    var fail = function() {
      ecies.privateKey();
    };
    fail.should.throw('no private key provided');
  });

  it('chainable function', function() {
    var ecies = ECIES()
      .privateKey(aliceKey)
      .publicKey(bobKey.publicKey);

    (ecies instanceof ECIES).should.equal(true);

  });

  var alice = ECIES()
    .privateKey(aliceKey)
    .publicKey(bobKey.publicKey);

  var bob = ECIES()
    .privateKey(bobKey)
    .publicKey(aliceKey.publicKey);

  var message = 'attack at dawn';
  var encrypted = '0339e504d6492b082da96e11e8f039796b06cd4855c101e2492a6f10f3e056a9e7499368e41313fa48f71759d13469c28b0bd6ff03a08b2ae5e6679e848f92db4b26a8ccf9c0b43f16eae6216c36380f70724743fe9053c98d94281aa74c94df40';
  var encBuf = new Buffer(encrypted, 'hex');

  it('correctly encrypts a message', function() {
    var encrypted = alice.encrypt(message);
    Buffer.isBuffer(encrypted).should.equal(true);
  });

  it('correctly decrypts a message', function() {
    var decrypted = bob
      .decrypt(encBuf)
      .toString();
    decrypted.should.equal(message);
  });

  it('retrieves senders publickey from the encypted buffer', function() {
    var bob2 = ECIES().privateKey(bobKey);
    var decrypted = bob2.decrypt(encBuf).toString();
    bob2._publicKey.toDER().should.deep.equal(aliceKey.publicKey.toDER());
    decrypted.should.equal(message);
  });

  it('roundtrips', function() {
    var secret = 'some secret message!!!';
    var encrypted = alice.encrypt(secret);
    var decrypted = bob
      .decrypt(encrypted)
      .toString();
    decrypted.should.equal(secret);
  });

  it('errors', function() {
    should.exist(bitcore.errors.ECIES);
  });


});
