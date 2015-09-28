/* global describe,it */
'use strict'
let Channel = require('../lib/channel')
let should = require('chai').should()

describe('Channel', function () {
  it('should satisfy this basic API', function () {
    let channel = Channel({}, {})
    should.exist(channel)
    should.exist(channel.opts)
    should.exist(channel.bufstream)
  })

  describe('#waitBuffers', function () {
    it('should give a buffer on new data', function () {
      let channel = Channel({}, true)
      let buffers = channel.waitBuffers()
      let next = buffers.next()
      channel.onBuffer(new Buffer([0]))
      return next.value
        .then(function (buf) {
          buf.length.should.equal(1)
        })
    })

    it('should yield error on sudden end', function () {
      let bufstream = {
        destroy: function () {}, // node
        close: function () {} // browser
      }
      let channel = Channel({}, bufstream)
      let buffers = channel.waitBuffers()
      let next = buffers.next()
      channel.close()
      return next.value
        .catch(function (error) {
          error.message.should.equal('channel closed while buffer waits outstanding')
          return buffers.next().value
        })
        .then(function (buf) {
          should.not.exist(buf)
        })
    })
  })
})
