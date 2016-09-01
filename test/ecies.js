'use strict';

var ECIES = require('../');

var should = require('chai').should();
var bitcore = require('bitcore-lib');
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

  it('correctly fails if trying to decrypt a bad message', function() {
    var encrypted = bitcore.util.buffer.copy(encBuf);
    encrypted[encrypted.length - 1] = 2;
    (function() { 
      return bob.decrypt(encrypted);
    }).should.throw('Invalid checksum');
  });

  it('decrypting uncompressed keys', function() {
    var secret = 'test';

    // test uncompressed
    var alicePrivateKey = new bitcore.PrivateKey.fromObject({
      bn: '1fa76f9c799ca3a51e2c7c901d3ba8e24f6d870beccf8df56faf30120b38f360',
      compressed: false,
      network: 'livenet'
    });
    var alicePublicKey = new bitcore.PublicKey.fromPrivateKey(alicePrivateKey); // alicePrivateKey.publicKey
    alicePrivateKey.compressed.should.equal(false);

    var cypher1 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey);
    var encrypted = cypher1.encrypt(secret);

    var cypher2 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey);
    var decrypted = cypher2.decrypt(encrypted);
    secret.should.equal(decrypted.toString());
  });
  
  it('decrypting compressed keys', function() {
    var secret = 'test';

    // test compressed
    var alicePrivateKey = new bitcore.PrivateKey.fromObject({
      bn: '1fa76f9c799ca3a51e2c7c901d3ba8e24f6d870beccf8df56faf30120b38f360',
      compressed: true,
      network: 'livenet'
    });
    var alicePublicKey = new bitcore.PublicKey.fromPrivateKey(alicePrivateKey); // alicePrivateKey.publicKey
    alicePrivateKey.compressed.should.equal(true);

    var cypher1 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey);
    var encrypted = cypher1.encrypt(secret);

    var cypher2 = ECIES().privateKey(alicePrivateKey).publicKey(alicePublicKey);
    var decrypted = cypher2.decrypt(encrypted);
    secret.should.equal(decrypted.toString());
  });
});
