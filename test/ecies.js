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
  var encrypted = '0339e504d6492b082da96e11e8f039796b06cd4855c101e2492a6f10f3e056a9e712c732611c6917ab5c57a1926973bc44a1586e94a783f81d05ce72518d9b0a80e2e13c7ff7d1306583f9cc7a48def5b37fbf2d5f294f128472a6e9c78dede5f5';
  var encBuf = new Buffer(encrypted, 'hex');

  it('correctly encrypts a message', function() {
    var ciphertext = alice.encrypt(message);
    Buffer.isBuffer(ciphertext).should.equal(true);
    ciphertext.toString('hex').should.equal(encrypted)
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

  it('roundtrips (no public key)', function() {
    alice.opts.noKey = true;
    bob.opts.noKey = true;
    var secret = 'some secret message!!!';
    var encrypted = alice.encrypt(secret);
    var decrypted = bob
      .decrypt(encrypted)
      .toString();
    decrypted.should.equal(secret);
  });

  it('roundtrips (short tag)', function() {
    alice.opts.shortTag = true;
    bob.opts.shortTag = true;
    var secret = 'some secret message!!!';
    var encrypted = alice.encrypt(secret);
    var decrypted = bob
      .decrypt(encrypted)
      .toString();
    decrypted.should.equal(secret);
  });

  it('roundtrips (no public key & short tag)', function() {
    alice.opts.noKey = true;
    alice.opts.shortTag = true;
    bob.opts.noKey = true;
    bob.opts.shortTag = true;
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
