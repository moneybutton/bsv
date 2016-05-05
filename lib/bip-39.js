/**
 * Bip39: Mnemonic Seeds
 * =====================
 *
 * Bip39 is a way to turn random entropy into a mnemonic (a string of words
 * from a wordlist), and then that mnemonic into a seed. The seed can then be
 * used in Bip32 to derive hierarchical deterministic keys. It does not go the
 * other way around (i.e., you cannot turn a seed into a mnemonic). The usual
 * way to use it is either to generate a new one, like this:
 *
 * let mnemonic = new Bip39().fromRandom().toString()
 *
 * or from a known mnemonic:
 *
 * let seed = new Bip39().fromString(mnemonic).toSeed()
 */
'use strict'
let dependencies = {
  Bw: require('./bw'),
  Hash: require('./hash'),
  Kdf: require('./kdf'),
  Random: require('./random'),
  Struct: require('./struct'),
  Wordlist: require('./bip-39-en'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let Hash = deps.Hash
  let Kdf = deps.Kdf
  let Random = deps.Random
  let Struct = deps.Struct
  let wordlist = deps.Wordlist
  let Workers = deps.Workers
  let asink = deps.asink

  class Bip39 extends Struct {
    constructor (mnemonic, seed) {
      super()
      this.fromObject({mnemonic, seed})
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      if (this.mnemonic) {
        let buf = new Buffer(this.mnemonic)
        bw.writeVarIntNum(buf.length)
        bw.write(buf)
      } else {
        bw.writeVarIntNum(0)
      }
      if (this.seed) {
        bw.writeVarIntNum(this.seed.length)
        bw.write(this.seed)
      } else {
        bw.writeVarIntNum(0)
      }
      return bw
    }

    fromBr (br) {
      let mnemoniclen = br.readVarIntNum()
      if (mnemoniclen > 0) {
        this.mnemonic = br.read(mnemoniclen).toString()
      }
      let seedlen = br.readVarIntNum()
      if (seedlen > 0) {
        this.seed = br.read(seedlen)
      }
      return this
    }

    /**
     * Generate a random new mnemonic from the wordlist.
     */
    fromRandom (bits) {
      if (!bits) {
        bits = 128
      }
      if (bits % 32 !== 0) {
        throw new Error('bits must be multiple of 32')
      }
      if (bits < 128) {
        throw new Error('bits must be at least 128')
      }
      let buf = Random.getRandomBuffer(bits / 8)
      this.entropy2mnemonic(buf)
      this.mnemonic2seed()
      return this
    }

    static fromRandom (bits) {
      return new this().fromRandom(bits)
    }

    asyncFromRandom (bits) {
      return asink(function * () {
        if (!bits) {
          bits = 128
        }
        let buf = Random.getRandomBuffer(bits / 8)
        let workersResult = yield Workers.asyncObjectMethod(this, 'entropy2mnemonic', [buf])
        let bip39 = new Bip39().fromFastBuffer(workersResult.resbuf)
        workersResult = yield Workers.asyncObjectMethod(bip39, 'mnemonic2seed', [])
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    static asyncFromRandom (bits) {
      return new this().asyncFromRandom(bits)
    }

    fromEntropy (buf) {
      this.entropy2mnemonic(buf)
      return this
    }

    static fromEntropy (buf) {
      return new this().fromEntropy(buf)
    }

    asyncFromEntropy (buf) {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'fromEntropy', [buf])
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    static asyncFromEntropy (buf) {
      return new this().asyncFromEntropy(buf)
    }

    fromString (mnemonic) {
      this.mnemonic = mnemonic
      return this
    }

    toString () {
      return this.mnemonic
    }

    toSeed (passphrase) {
      this.mnemonic2seed(passphrase)
      return this.seed
    }

    asyncToSeed (passphrase) {
      return asink(function * () {
        if (passphrase === undefined) {
          passphrase = ''
        }
        let args = [passphrase]
        let workersResult = yield Workers.asyncObjectMethod(this, 'toSeed', args)
        return workersResult.resbuf
      }, this)
    }

    /**
     * Generate a new mnemonic from some entropy generated somewhere else. The
     * entropy must be at least 128 bits.
     */
    entropy2mnemonic (buf) {
      if (!Buffer.isBuffer(buf) || buf.length < 128 / 8) {
        throw new Error('Entropy is less than 128 bits. It must be 128 bits or more.')
      }

      let hash = Hash.sha256(buf)
      let bin = ''
      let bits = buf.length * 8
      for (let i = 0; i < buf.length; i++) {
        bin = bin + ('00000000' + buf[i].toString(2)).slice(-8)
      }
      let hashbits = hash[0].toString(2)
      hashbits = ('00000000' + hashbits).slice(-8).slice(0, bits / 32)
      bin = bin + hashbits

      if (bin.length % 11 !== 0) {
        throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length)
      }

      let mnemonic = ''
      for (let i = 0; i < bin.length / 11; i++) {
        if (mnemonic !== '') {
          mnemonic = mnemonic + wordlist.space
        }
        let wi = parseInt(bin.slice(i * 11, (i + 1) * 11), 2)
        mnemonic = mnemonic + wordlist[wi]
      }

      this.mnemonic = mnemonic
      return this
    }

    /**
     * Check that a mnemonic is valid. This means there should be no superfluous
     * whitespace, no invalid words, and the checksum should match.
     */
    check () {
      let mnemonic = this.mnemonic

      // confirm no invalid words
      let words = mnemonic.split(wordlist.space)
      let bin = ''
      for (let i = 0; i < words.length; i++) {
        let ind = wordlist.indexOf(words[i])
        if (ind < 0) {
          return false
        }
        bin = bin + ('00000000000' + ind.toString(2)).slice(-11)
      }

      if (bin.length % 11 !== 0) {
        throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length)
      }

      // confirm checksum
      let cs = bin.length / 33
      let hashBits = bin.slice(-cs)
      let nonhashBits = bin.slice(0, bin.length - cs)
      let buf = new Buffer(nonhashBits.length / 8)
      for (let i = 0; i < nonhashBits.length / 8; i++) {
        buf.writeUInt8(parseInt(bin.slice(i * 8, (i + 1) * 8), 2), i)
      }
      let hash = Hash.sha256(buf)
      let expectedHashBits = hash[0].toString(2)
      expectedHashBits = ('00000000' + expectedHashBits).slice(-8).slice(0, cs)

      return expectedHashBits === hashBits
    }

    /**
     * Convert a mnemonic to a seed. Does not check for validity of the mnemonic -
     * for that, you should manually run check() first.
     */
    mnemonic2seed (passphrase) {
      let mnemonic = this.mnemonic
      if (!this.check()) {
        throw new Error('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?')
      }
      if (passphrase === undefined) {
        passphrase = ''
      } else if (typeof passphrase !== 'string') {
        throw new Error('passphrase must be a string or undefined')
      }
      mnemonic = mnemonic.normalize('NFKD')
      passphrase = passphrase.normalize('NFKD')
      let mbuf = new Buffer(mnemonic)
      let pbuf = Buffer.concat([new Buffer('mnemonic'), new Buffer(passphrase)])
      this.seed = Kdf.PBKdf2(mbuf, pbuf, 2048, 64 * 8)
      return this
    }
  }

  return Bip39
}

inject = require('injecter')(inject, dependencies)
let Bip39 = inject()
Bip39.En = inject({
  Wordlist: require('./bip-39-en')
})
Bip39.Jp = inject({
  Wordlist: require('./bip-39-jp')
})
module.exports = Bip39
