'use strict';
let should = require('chai').should();
let Struct = require('../lib/struct');
let BR = require('../lib/br');
let BW = require('../lib/bw');

describe('Struct', function () {
  it('should make a new struct', function () {
    let struct = new Struct();
    should.exist(struct);
    struct = Struct();
    should.exist(struct);
  });

  describe('#fromObject', function () {
    it('should set from an object', function () {
      Struct().fromObject({test: 'test'}).test.should.equal('test');
      Object.keys(Struct().fromObject({})).length.should.equal(0);
    });

  });

  describe('#fromBR', function () {
    it('should throw an error if arg is not a BR', function () {
      (function () {
        Struct().fromBR({});
      }).should.throw('br must be a buffer reader');
    });

    it('should throw a not implemented error', function () {
      (function () {
        let br = BR();
        Struct().fromBR(br);
      }).should.throw('not implemented');
    });

  });

  describe('#toBW', function () {
    it('should throw a not implemented error', function () {
      (function () {
        Struct().toBW();
      }).should.throw('not implemented');
    });

  });

  describe('#fromBuffers', function () {
    it('should throw an error', function () {
      (function () {
        Struct().fromBuffers().next();
      }).should.throw('not implemented');
    });

  });

  describe('#fromBuffer', function () {
    it('should throw an error if arg is not a buffer', function () {
      (function () {
        Struct().fromBuffer({});
      }).should.throw('buf must be a buffer');
    });

    it('should throw a not implemented error', function () {
      (function () {
        var buf = new Buffer([]);
        Struct().fromBuffer(buf);
      }).should.throw('not implemented');
    });

  });

  describe('#toBuffer', function () {
    it('should throw a not implemented error', function () {
      (function () {
        Struct().toBuffer();
      }).should.throw('not implemented');
    });

  });

  describe('#fromHex', function () {
    it('should throw an error for invalid hex string', function () {
      (function () {
        Struct().fromHex('0');
      }).should.throw('invalid hex string');
    });

    it('should throw a not implemented error', function () {
      (function () {
        Struct().fromHex('00');
      }).should.throw('not implemented');
    });

  });

  describe('#toHex', function () {
    it('should throw a not implemented error', function () {
      (function () {
        Struct().toHex();
      }).should.throw('not implemented');
    });

  });

  describe('#fromString', function () {
    it('should throw an error for invalid string', function () {
      (function () {
        Struct().fromString({});
      }).should.throw('str must be a string');
    });

    it('should throw a not implemented error', function () {
      (function () {
        Struct().fromString('00');
      }).should.throw('not implemented');
    });

  });

  describe('#toString', function () {
    it('should throw a not implemented error', function () {
      (function () {
        Struct().toString();
      }).should.throw('not implemented');
    });

  });

  describe('#fromJSON', function () {
    it('should throw a not implemented error', function () {
      (function () {
        Struct().fromJSON();
      }).should.throw('not implemented');
    });

  });

  describe('#toJSON', function () {
    it('should throw a not implemented error', function () {
      (function () {
        Struct().toJSON();
      }).should.throw('not implemented');
    });

  });

});
