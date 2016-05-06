/**
 * Ecdsa
 * =====
 *
 * Ecdsa is the signature algorithm used by bitcoin. The way you probably want
 * to use this is with the static Ecdsa.sign( ... ) and Ecdsa.verify( ... )
 * functions. Note that in bitcoin, the hashBuf is little endian, so if you are
 * signIng or verifying something that has to do with a transaction, you should
 * explicitly plug in that it is little endian as an option to the sign and
 * verify functions.
 *
 * This implementation of Ecdsa uses deterministic signatures as defined in RFC
 * 6979 as the default, which has become a defacto standard in bitcoin wallets
 * due to recurring security issues around using a value of k pulled from a
 * possibly faulty entropy pool. If you use the same value of k twice, someone
 * can derive your private key. Deterministic k prevents this without needing
 * an entropy pool.
 */
'use strict'
let dependencies = {
  Bn: require('./bn'),
  Hash: require('./hash'),
  KeyPair: require('./key-pair'),
  Point: require('./point'),
  PubKey: require('./pub-key'),
  Random: require('./random'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Hash = deps.Hash
  let KeyPair = deps.KeyPair
  let Point = deps.Point
  let PubKey = deps.PubKey
  let Random = deps.Random
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Workers = deps.Workers
  let asink = deps.asink

  class Ecdsa extends Struct {
    constructor (sig, keyPair, hashBuf, k, endian, verified) {
      super()
      this.fromObject({sig, keyPair, hashBuf, k, endian, verified})
    }

    toJson () {
      return {
        sig: this.sig ? this.sig.toString() : undefined,
        keyPair: this.keyPair ? this.keyPair.toBuffer().toString('hex') : undefined,
        hashBuf: this.hashBuf ? this.hashBuf.toString('hex') : undefined,
        k: this.k ? this.k.toString() : undefined,
        endian: this.endian,
        verified: this.verified
      }
    }

    fromJson (json) {
      this.sig = json.sig ? new Sig().fromString(json.sig) : undefined
      this.keyPair = json.keyPair ? new KeyPair().fromBuffer(new Buffer(json.keyPair, 'hex')) : undefined
      this.hashBuf = json.hashBuf ? new Buffer(json.hashBuf, 'hex') : undefined
      this.k = json.k ? new Bn().fromString(json.k) : undefined
      this.endian = json.endian
      this.verified = json.verified
      return this
    }

    toBuffer () {
      let str = JSON.stringify(this.toJson())
      return new Buffer(str)
    }

    fromBuffer (buf) {
      let json = JSON.parse(buf.toString())
      return this.fromJson(json)
    }

    calcrecovery () {
      for (let recovery = 0; recovery < 4; recovery++) {
        let Qprime
        this.sig.recovery = recovery
        try {
          Qprime = this.sig2PubKey()
        } catch (e) {
          continue
        }

        if (Qprime.point.eq(this.keyPair.pubKey.point)) {
          let compressed = this.keyPair.pubKey.compressed
          this.sig.compressed = this.keyPair.pubKey.compressed === undefined ? true : compressed
          return this
        }
      }

      this.sig.recovery = undefined
      throw new Error('Unable to find valid recovery factor')
    }

    asyncCalcrecovery () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'calcrecovery', [])
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    /**
     * Calculates the recovery factor, and mutates sig so that it now contains
     * the recovery factor and the "compressed" variable. Throws an exception on
     * failure.
     */
    static calcrecovery (sig, pubKey, hashBuf) {
      let ecdsa = new Ecdsa().fromObject({
        sig: sig,
        keyPair: new KeyPair().fromObject({pubKey: pubKey}),
        hashBuf: hashBuf
      })
      return ecdsa.calcrecovery().sig
    }

    static asyncCalcrecovery (sig, pubKey, hashBuf) {
      return asink(function * () {
        let workersResult = yield Workers.asyncClassMethod('Ecdsa', 'calcrecovery', [sig, pubKey, hashBuf])
        return new Sig().fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    fromString (str) {
      let obj = JSON.parse(str)
      if (obj.hashBuf) {
        this.hashBuf = new Buffer(obj.hashBuf, 'hex')
      }
      if (obj.keyPair) {
        this.keyPair = new KeyPair().fromString(obj.keyPair)
      }
      if (obj.sig) {
        this.sig = new Sig().fromString(obj.sig)
      }
      if (obj.k) {
        this.k = new Bn(obj.k, 10)
      }
      return this
    }

    randomK () {
      let N = Point.getN()
      let k
      do {
        k = new Bn().fromBuffer(Random.getRandomBuffer(32))
      } while (!(k.lt(N) && k.gt(0)))
      this.k = k
      return this
    }

    /**
     * The traditional Ecdsa algorithm uses a purely random value of k. This has
     * the negative that when signIng, your entropy must be good, or the private
     * key can be recovered if two signatures use the same value of k. It turns out
     * that k does not have to be purely random. It can be deterministic, so long
     * as an attacker can't guess it. RFC 6979 specifies how to do this using a
     * combination of the private key and the hash of the thing to be signed. It is
     * best practice to use this value, which can be tested for byte-for-byte
     * accuracy, and is resistant to a broken RNG. Note that it is actually the
     * case that bitcoin private keys have been compromised through that attack.
     * Deterministic k is a best practice.
     *
     * https://tools.ietf.org/html/rfc6979#section-3.2
     */
    deterministicK (badrs) {
      let v = new Buffer(32)
      v.fill(0x01)
      let k = new Buffer(32)
      k.fill(0x00)
      let x = this.keyPair.privKey.bn.toBuffer({size: 32})
      k = Hash.sha256Hmac(Buffer.concat([v, new Buffer([0x00]), x, this.hashBuf]), k)
      v = Hash.sha256Hmac(v, k)
      k = Hash.sha256Hmac(Buffer.concat([v, new Buffer([0x01]), x, this.hashBuf]), k)
      v = Hash.sha256Hmac(v, k)
      v = Hash.sha256Hmac(v, k)
      let T = new Bn().fromBuffer(v)
      let N = Point.getN()

      // if r or s were invalid when this function was used in signIng,
      // we do not want to actually compute r, s here for efficiency, so,
      // we can increment badrs. explained at end of RFC 6979 section 3.2
      if (badrs === undefined) {
        badrs = 0
      }
      // also explained in 3.2, we must ensure T is in the proper range (0, N)
      for (let i = 0; i < badrs || !(T.lt(N) && T.gt(0)); i++) {
        k = Hash.sha256Hmac(Buffer.concat([v, new Buffer([0x00])]), k)
        v = Hash.sha256Hmac(v, k)
        v = Hash.sha256Hmac(v, k)
        T = new Bn().fromBuffer(v)
      }

      this.k = T
      return this
    }

    /**
     * Information about public key recovery:
     * https://bitcointalk.org/index.php?topic=6430.0
     * http://stackoverflow.com/questions/19665491/how-do-i-get-an-ecdsa-public-key-from-just-a-bitcoin-signature-sec1-4-1-6-k
     * This code was originally taken from BitcoinJS
     */
    sig2PubKey () {
      let recovery = this.sig.recovery
      if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
        throw new Error('i must be equal to 0, 1, 2, or 3')
      }

      let e = new Bn().fromBuffer(this.hashBuf)
      let r = this.sig.r
      let s = this.sig.s

      // A set LSB signifies that the y-coordinate is odd
      let isYOdd = recovery & 1

      // The more significant bit specifies whether we should use the
      // first or second candidate key.
      let isSecondKey = recovery >> 1

      let n = Point.getN()
      let G = Point.getG()

      // 1.1 LEt x = r + jn
      let x = isSecondKey ? r.add(n) : r
      let R = Point.fromX(isYOdd, x)

      // 1.4 Check that nR is at infinity
      let nR = R.mul(n)

      if (!nR.isInfinity()) {
        throw new Error('nR is not a valid curve point')
      }

      // Compute -e from e
      let eNeg = e.neg().umod(n)

      // 1.6.1 Compute Q = r^-1 (sR - eG)
      // Q = r^-1 (sR + -eG)
      let rInv = r.invm(n)

      // let Q = R.multiplyTwo(s, G, eNeg).mul(rInv)
      let Q = R.mul(s).add(G.mul(eNeg)).mul(rInv)

      let pubKey = new PubKey(Q)
      pubKey.compressed = this.sig.compressed
      pubKey.validate()

      return pubKey
    }

    asyncSig2pubKey () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'sig2PubKey', [])
        return PubKey.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    static sig2PubKey (sig, hashBuf) {
      let ecdsa = new Ecdsa().fromObject({
        sig: sig,
        hashBuf: hashBuf
      })
      return ecdsa.sig2PubKey()
    }

    static asyncSig2pubKey (sig, hashBuf) {
      return asink(function * () {
        let ecdsa = new Ecdsa().fromObject({
          sig: sig,
          hashBuf: hashBuf
        })
        let pubKey = yield ecdsa.asyncSig2pubKey()
        return pubKey
      }, this)
    }

    verifyStr () {
      if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 32) {
        return 'hashBuf must be a 32 byte buffer'
      }

      try {
        this.keyPair.pubKey.validate()
      } catch (e) {
        return 'Invalid pubKey: ' + e
      }

      let r = this.sig.r
      let s = this.sig.s
      if (!(r.gt(0) && r.lt(Point.getN())) ||
        !(s.gt(0) && s.lt(Point.getN()))) {
        return 'r and s not in range'
      }

      let e = new Bn().fromBuffer(this.hashBuf, this.endian ? {endian: this.endian} : undefined)
      let n = Point.getN()
      let sinv = s.invm(n)
      let u1 = sinv.mul(e).mod(n)
      let u2 = sinv.mul(r).mod(n)

      let p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2)
      // let p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2)
      if (p.isInfinity()) {
        return 'p is infinity'
      }

      if (!(p.getX().mod(n).cmp(r) === 0)) {
        return 'Invalid signature'
      } else {
        return false
      }
    }

    sign () {
      let hashBuf = this.hashBuf
      let privKey = this.keyPair.privKey

      let d = privKey.bn

      if (!hashBuf || !privKey || !d) {
        throw new Error('invalid parameters')
      }

      if (!Buffer.isBuffer(hashBuf) || hashBuf.length !== 32) {
        throw new Error('hashBuf must be a 32 byte buffer')
      }

      let N = Point.getN()
      let G = Point.getG()
      let e = new Bn().fromBuffer(hashBuf, this.endian ? {endian: this.endian} : undefined)

      // try different values of k until r, s are valid
      let badrs = 0
      let k, Q, r, s
      do {
        if (!this.k || badrs > 0) {
          this.deterministicK(badrs)
        }
        badrs++
        k = this.k
        Q = G.mul(k)
        r = Q.getX().mod(N)
        s = k.invm(N).mul(e.add(d.mul(r))).mod(N)
      } while (r.cmp(0) <= 0 || s.cmp(0) <= 0)

      // enforce low s
      // see Bip 62, "low S values in signatures"
      if (s.gt(new Bn().fromBuffer(new Buffer('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
        s = Point.getN().sub(s)
      }
      this.sig = Sig.fromObject({r: r, s: s, compressed: this.keyPair.pubKey.compressed})
      return this
    }

    asyncSign () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'sign', [])
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    signRandomK () {
      this.randomK()
      return this.sign()
    }

    toString () {
      let obj = {}
      if (this.hashBuf) {
        obj.hashBuf = this.hashBuf.toString('hex')
      }
      if (this.keyPair) {
        obj.keyPair = this.keyPair.toString()
      }
      if (this.sig) {
        obj.sig = this.sig.toString()
      }
      if (this.k) {
        obj.k = this.k.toString()
      }
      return JSON.stringify(obj)
    }

    verify () {
      if (!this.verifyStr()) {
        this.verified = true
      } else {
        this.verified = false
      }
      return this
    }

    asyncVerify () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'verify', [])
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    static sign (hashBuf, keyPair, endian) {
      return new Ecdsa().fromObject({
        hashBuf: hashBuf,
        endian: endian,
        keyPair: keyPair
      }).sign().sig
    }

    static asyncSign (hashBuf, keyPair, endian) {
      return asink(function * () {
        let ecdsa = new Ecdsa().fromObject({
          hashBuf: hashBuf,
          endian: endian,
          keyPair: keyPair
        })
        yield ecdsa.asyncSign()
        return ecdsa.sig
      }, this)
    }

    static verify (hashBuf, sig, pubKey, endian) {
      return new Ecdsa().fromObject({
        hashBuf: hashBuf,
        endian: endian,
        sig: sig,
        keyPair: new KeyPair().fromObject({pubKey: pubKey})
      }).verify().verified
    }

    static asyncVerify (hashBuf, sig, pubKey, endian) {
      return asink(function * () {
        let ecdsa = new Ecdsa().fromObject({
          hashBuf: hashBuf,
          endian: endian,
          sig: sig,
          keyPair: new KeyPair().fromObject({pubKey: pubKey})
        })
        yield ecdsa.asyncVerify()
        return ecdsa.verified
      }, this)
    }
  }

  return Ecdsa
}

inject = require('injecter')(inject, dependencies)
let Ecdsa = inject()
Ecdsa.MainNet = inject({
  KeyPair: require('./key-pair').MainNet
})
Ecdsa.TestNet = inject({
  KeyPair: require('./key-pair').TestNet
})
module.exports = Ecdsa
