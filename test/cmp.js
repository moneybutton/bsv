/* global describe,it */
'use strict'
import { cmp } from '../lib/cmp'
import 'should'

describe('cmp', function () {
  it('should know if these buffers are equal', function () {
    let buf1, buf2

    buf1 = Buffer.from([])
    buf2 = Buffer.from([])
    cmp(buf1, buf2).should.equal(true)

    buf1 = Buffer.from([1])
    buf2 = Buffer.from([])
    cmp(buf1, buf2).should.equal(false)

    buf1 = Buffer.from([])
    buf2 = Buffer.from([1])
    cmp(buf1, buf2).should.equal(false)

    buf1 = Buffer.from([1])
    buf2 = Buffer.from([1])
    cmp(buf1, buf2).should.equal(true)

    buf1 = Buffer.from([1, 1])
    buf2 = Buffer.from([1])
    cmp(buf1, buf2).should.equal(false)

    buf1 = Buffer.from([1])
    buf2 = Buffer.from([1, 1])
    cmp(buf1, buf2).should.equal(false)

    buf1 = Buffer.from([1, 1])
    buf2 = Buffer.from([1, 1])
    cmp(buf1, buf2).should.equal(true)

    buf1 = Buffer.from([1, 0])
    buf2 = Buffer.from([1, 1])
    cmp(buf1, buf2).should.equal(false)

    buf1 = Buffer.from([1])
    buf2 = Buffer.from([1, 0])
    cmp(buf1, buf2).should.equal(false)
    ;(function () {
      let buf1 = ''
      let buf2 = Buffer.from([0])
      cmp(buf1, buf2)
    }.should.throw('buf1 and buf2 must be buffers'))
    ;(function () {
      let buf1 = Buffer.from([0])
      let buf2 = ''
      cmp(buf1, buf2)
    }.should.throw('buf1 and buf2 must be buffers'))
  })
})
