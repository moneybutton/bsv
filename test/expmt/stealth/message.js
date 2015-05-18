var Keypair = require('../../../lib/keypair');
var SMessage = require('../../../lib/expmt/stealth/message');
var SKey = require('../../../lib/expmt/stealth/key');
var SAddress = require('../../../lib/expmt/stealth/address');
var KDF = require('../../../lib/kdf');
var Hash = require('../../../lib/hash');
var should = require('chai').should();
var Address = require('../../../lib/address');

describe('SMessage', function() {

  var payloadKeypair = KDF.buf2keypair(new Buffer('key1'));
  var scanKeypair = KDF.buf2keypair(new Buffer('key2'));
  var fromKeypair = KDF.buf2keypair(new Buffer('key3'));
  var enchex = 'f557994f16d0d628fa4fdb4ab3d7e0bc5f2754f20381c7831a20c7c9ec88dcf092ea3683261798ccda991ed65a3a54a036d8125dec0381c7831a20c7c9ec88dcf092ea3683261798ccda991ed65a3a54a036d8125dec9f86d081884c7d659a2feaa0c55ad01560ba2904d3bc8395b6c4a6f87648edb33db6a22170e5e26f340c7ba943169210234cd6a753ad13919b0ab7d678b47b5e7d63e452382de2c2590fb57ef048f7b3';
  var encbuf = new Buffer(enchex, 'hex');
  var ivbuf = Hash.sha256(new Buffer('test')).slice(0, 128 / 8);
  var sk = SKey().fromObject({payloadKeypair: payloadKeypair, scanKeypair: scanKeypair});
  var sa = SAddress().fromSKey(sk);
  var messagebuf = new Buffer('this is my message');
  
  it('should make a new stealthmessage', function() {
    var sm = new SMessage();
    should.exist(sm);
    sm = SMessage()
    should.exist(sm);
  });

  it('should allow "set" style syntax', function() {
    var encbuf = SMessage().fromObject({
      messagebuf: messagebuf,
      toSAddress: sa
    }).encrypt().encbuf;
    should.exist(encbuf);
    encbuf.length.should.equal(113);
  });

  describe('#set', function() {
    
    it('should set the messagebuf', function() {
      var sm = SMessage().fromObject({messagebuf: messagebuf});
      should.exist(sm.messagebuf);
    });

  });

  describe('@encrypt', function() {

    it('should encrypt a message', function() {
      var encbuf = SMessage.encrypt(messagebuf, sa);
      encbuf.length.should.equal(166);
    });

    it('should encrypt a message with this fromKeypair and ivbuf the same each time', function() {
      var encbuf = SMessage.encrypt(messagebuf, sa, fromKeypair, ivbuf);
      encbuf.length.should.equal(166);
      encbuf.toString('hex').should.equal(enchex);
    });

  });

  describe('@decrypt', function() {

    it('should decrypt this known message correctly', function() {
      var messagebuf2 = SMessage.decrypt(encbuf, sk);
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'));
    });

  });

  describe('@isForMe', function() {

    it('should know that this message is for me', function() {
      SMessage.isForMe(encbuf, sk).should.equal(true);
    });

    it('should know that this message is for me even if my payloadPrivkey is not present', function() {
      var sk2 = new SKey();
      sk2.scanKeypair = sk.scanKeypair;
      sk2.payloadKeypair = Keypair().fromObject({pubkey: sk.payloadKeypair.pubkey});
      should.not.exist(sk2.payloadKeypair.privkey);
      SMessage.isForMe(encbuf, sk2).should.equal(true);
    });

  });

  describe('#encrypt', function() {
    
    it('should encrypt this message', function() {
      var sm = SMessage().fromObject({
        messagebuf: messagebuf,
        toSAddress: sa,
        fromKeypair: fromKeypair
      });
      sm.encrypt().encbuf.length.should.equal(113);
    });

  });

  describe('#decrypt', function() {
    
    it('should decrypt that which was encrypted', function() {
      var sm = SMessage().fromObject({
        messagebuf: messagebuf,
        toSAddress: sa
      }).encrypt();
      var messagebuf2 = SMessage().fromObject({
        encbuf: sm.encbuf,
        fromKeypair: sm.fromKeypair,
        toSKey: sk
      }).decrypt().messagebuf;
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'));
    });

  });

  describe('#isForMe', function() {
    
    it('should know that this message is for me', function() {
      SMessage().fromObject({
        encbuf: encbuf,
        toSKey: sk,
        fromKeypair: fromKeypair,
        receiveAddress: Address().fromObject({hashbuf: encbuf.slice(0, 20)})
      }).isForMe().should.equal(true);
    });

    it('should know that this message is not for me', function() {
      SMessage().fromObject({
        encbuf: encbuf,
        toSKey: sk,
        fromKeypair: fromKeypair,
        receiveAddress: Address().fromObject({hashbuf: encbuf.slice(0, 20)})
      }).isForMe().should.equal(true);
    });

  });

});
