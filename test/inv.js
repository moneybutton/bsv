/* global describe,it */
'use strict'
let Inv = require('../lib/inv')
let Hash = require('../lib/hash')
let BW = require('../lib/bw')
let should = require('chai').should()

describe('Inv', function () {
  it('should exist', function () {
    let inv = Inv()
    should.exist(inv)
    should.exist(Inv)
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let hashbuf = Hash.sha256(new Buffer(0))
      let typenum = 1
      let typebuf = BW().writeUInt32BE(typenum).toBuffer()
      let buf = Buffer.concat([typebuf, hashbuf])
      let inv = Inv().fromBuffer(buf)
      inv.typenum.should.equal(typenum)
      Buffer.compare(inv.hashbuf, hashbuf).should.equal(0)
    })
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let hashbuf = Hash.sha256(new Buffer(0))
      let typenum = 1
      let typebuf = BW().writeUInt32BE(typenum).toBuffer()
      let buf = Buffer.concat([typebuf, hashbuf])
      let inv = Inv().fromBuffer(buf)
      let buf2 = inv.toBuffer()
      Buffer.compare(buf, buf2).should.equal(0)
    })
  })
})
