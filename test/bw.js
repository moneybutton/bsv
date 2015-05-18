"use strict";
let BW = require('../lib/bw');
let BR = require('../lib/br');
let BN = require('../lib/bn');
let should = require('chai').should();

describe('BW', function() {

  it('should create a new buffer writer', function() {
    let bw = new BW();
    should.exist(bw);
  });

  describe('#set', function() {
    
    it('set bufs', function() {
      let buf1 = new Buffer([0]);
      let buf2 = new Buffer([1]);
      let bufs = [buf1, buf2];
      let bw = new BW().fromObject({bufs: [buf1, buf2]});
      bw.concat().toString('hex').should.equal('0001');
    });

  });

  describe('#toBuffer', function() {
    
    it('should concat these two bufs', function() {
      let buf1 = new Buffer([0]);
      let buf2 = new Buffer([1]);
      let bw = new BW({bufs: [buf1, buf2]});
      bw.toBuffer().toString('hex').should.equal('0001');
    });

  });

  describe('#concat', function() {
    
    it('should concat these two bufs', function() {
      let buf1 = new Buffer([0]);
      let buf2 = new Buffer([1]);
      let bw = new BW({bufs: [buf1, buf2]});
      bw.concat().toString('hex').should.equal('0001');
    });

  });

  describe('#write', function() {

    it('should write a buffer', function() {
      let buf = new Buffer([0]);
      let bw = new BW();
      bw.write(buf);
      bw.concat().toString('hex').should.equal('00');
    });

  });

  describe('#writeReverse', function() {

    it('should write a buffer in reverse', function() {
      let buf = new Buffer([0, 1]);
      let bw = new BW();
      bw.writeReverse(buf);
      bw.concat().toString('hex').should.equal('0100');
    });

  });

  describe('#writeUInt8', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt8(1).concat().toString('hex').should.equal('01');
    });

  });

  describe('#writeInt8', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeInt8(1).concat().toString('hex').should.equal('01');
      BW().writeInt8(-1).concat().toString('hex').should.equal('ff');
    });

  });

  describe('#writeUInt16BE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt16BE(1).concat().toString('hex').should.equal('0001');
    });

  });

  describe('#writeInt16BE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeInt16BE(1).concat().toString('hex').should.equal('0001');
      BW().writeInt16BE(-1).concat().toString('hex').should.equal('ffff');
    });

  });

  describe('#writeUInt16LE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt16LE(1).concat().toString('hex').should.equal('0100');
    });

  });

  describe('#writeInt16LE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeInt16LE(1).concat().toString('hex').should.equal('0100');
      BW().writeInt16LE(-1).concat().toString('hex').should.equal('ffff');
    });

  });

  describe('#writeUInt32BE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt32BE(1).concat().toString('hex').should.equal('00000001');
    });

  });

  describe('#writeInt32BE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeInt32BE(1).concat().toString('hex').should.equal('00000001');
      BW().writeInt32BE(-1).concat().toString('hex').should.equal('ffffffff');
    });

  });

  describe('#writeUInt32LE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt32LE(1).concat().toString('hex').should.equal('01000000');
    });

  });

  describe('#writeInt32LE', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeInt32LE(1).concat().toString('hex').should.equal('01000000');
      BW().writeInt32LE(-1).concat().toString('hex').should.equal('ffffffff');
    });

  });

  describe('#writeUInt64BEBN', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt64BEBN(BN(1)).concat().toString('hex').should.equal('0000000000000001');
    });

  });

  describe('#writeUInt64LEBN', function() {
    
    it('should write 1', function() {
      let bw = new BW();
      bw.writeUInt64LEBN(BN(1)).concat().toString('hex').should.equal('0100000000000000');
    });

  });

  describe('#writeVarint', function() {
    
    it('should write a 1 byte varint', function() {
      let bw = new BW();
      bw.writeVarintNum(1);
      bw.concat().length.should.equal(1);
    });

    it('should write a 3 byte varint', function() {
      let bw = new BW();
      bw.writeVarintNum(1000);
      bw.concat().length.should.equal(3);
    });

    it('should write a 5 byte varint', function() {
      let bw = new BW();
      bw.writeVarintNum(Math.pow(2, 16 + 1));
      bw.concat().length.should.equal(5);
    });

    it('should write a 9 byte varint', function() {
      let bw = new BW();
      bw.writeVarintNum(Math.pow(2, 32 + 1));
      bw.concat().length.should.equal(9);
    });

    it('should read back the same value it wrote for a 9 byte varint', function() {
      let bw = new BW();
      let n = Math.pow(2, 53);
      n.should.equal(n + 1); //javascript number precision limit
      bw.writeVarintNum(n);
      let br = new BR({buf: bw.concat()});
      br.readVarintBN().toNumber().should.equal(n);
    });

  });

  describe('#writeVarintBN', function() {
    
    it('should write a 1 byte varint', function() {
      let bw = new BW();
      bw.writeVarintBN(BN(1));
      bw.concat().length.should.equal(1);
    });

    it('should write a 3 byte varint', function() {
      let bw = new BW();
      bw.writeVarintBN(BN(1000));
      bw.concat().length.should.equal(3);
    });

    it('should write a 5 byte varint', function() {
      let bw = new BW();
      bw.writeVarintBN(BN(Math.pow(2, 16 + 1)));
      bw.concat().length.should.equal(5);
    });

    it('should write a 9 byte varint', function() {
      let bw = new BW();
      bw.writeVarintBN(BN(Math.pow(2, 32 + 1)));
      bw.concat().length.should.equal(9);
    });

  });

});
