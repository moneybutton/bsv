/* global describe,it */
import { Random } from '../lib/random'
import 'should'

describe('Random', function () {
  describe('@getRandomBuffer', function () {
    it('should return a buffer', function () {
      let bytes = Random.getRandomBuffer(8)
      bytes.length.should.equal(8)
      Buffer.isBuffer(bytes).should.equal(true)
    })

    it('should not equate two 256 bit random buffers', function () {
      let bytes1 = Random.getRandomBuffer(32)
      let bytes2 = Random.getRandomBuffer(32)
      bytes1.toString('hex').should.not.equal(bytes2.toString('hex'))
    })

    it('should generate 100 8 byte buffers in a row that are not equal', function () {
      let hexs = []
      for (let i = 0; i < 100; i++) {
        hexs[i] = Random.getRandomBuffer(8).toString('hex')
      }
      for (let i = 0; i < 100; i++) {
        for (let j = i + 1; j < 100; j++) {
          hexs[i].should.not.equal(hexs[j])
        }
      }
    })
  })
})
