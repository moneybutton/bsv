/* global describe,it */
'use strict'
import { Bip32 } from '../lib/bip-32'
import { Base58Check } from '../lib/base-58-check'
import { PrivKey } from '../lib/priv-key'
import should from 'should'

describe('Bip32', function () {
  it('should satisfy these basic API features', function () {
    Bip32.fromRandom()
      .toString()
      .slice(0, 4)
      .should.equal('xprv')
    Bip32.fromRandom()
      .toPublic()
      .toString()
      .slice(0, 4)
      .should.equal('xpub')
    Bip32.Testnet.fromRandom()
      .toString()
      .slice(0, 4)
      .should.equal('tprv')
    Bip32.Testnet.fromRandom()
      .toPublic()
      .toString()
      .slice(0, 4)
      .should.equal('tpub')
  })

  // test vectors: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
  const vector1master = '000102030405060708090a0b0c0d0e0f'
  const vector1mPublic =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8'
  const vector1mPrivate =
    'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
  const vector1m0hPublic =
    'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw'
  const vector1m0hPrivate =
    'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7'
  const vector1m0h1Public =
    'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ'
  const vector1m0h1Private =
    'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs'
  const vector1m0h12hPublic =
    'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5'
  const vector1m0h12hPrivate =
    'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM'
  const vector1m0h12h2Public =
    'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV'
  const vector1m0h12h2Private =
    'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334'
  const vector1m0h12h21000000000Public =
    'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy'
  const vector1m0h12h21000000000Private =
    'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76'
  const vector2master =
    'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542'
  const vector2mPublic =
    'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB'
  const vector2mPrivate =
    'xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U'
  const vector2m0Public =
    'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH'
  const vector2m0Private =
    'xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt'
  const vector2m02147483647hPublic =
    'xpub6ASAVgeehLbnwdqV6UKMHVzgqAG8Gr6riv3Fxxpj8ksbH9ebxaEyBLZ85ySDhKiLDBrQSARLq1uNRts8RuJiHjaDMBU4Zn9h8LZNnBC5y4a'
  const vector2m02147483647hPrivate =
    'xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9'
  const vector2m02147483647h1Public =
    'xpub6DF8uhdarytz3FWdA8TvFSvvAh8dP3283MY7p2V4SeE2wyWmG5mg5EwVvmdMVCQcoNJxGoWaU9DCWh89LojfZ537wTfunKau47EL2dhHKon'
  const vector2m02147483647h1Private =
    'xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef'
  const vector2m02147483647h12147483646hPublic =
    'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL'
  const vector2m02147483647h12147483646hPrivate =
    'xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc'
  const vector2m02147483647h12147483646h2Public =
    'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt'
  const vector2m02147483647h12147483646h2Private =
    'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j'

  it('should make a new a bip32', function () {
    let bip32
    bip32 = new Bip32()
    should.exist(bip32)
    bip32 = new Bip32()
    should.exist(bip32)
    new Bip32()
      .fromString(vector1mPrivate)
      .toString()
      .should.equal(vector1mPrivate)
    new Bip32()
      .fromString(vector1mPrivate)
      .toString()
      .should.equal(vector1mPrivate)
    new Bip32()
      .fromString(new Bip32().fromString(vector1mPrivate).toString())
      .toString()
      .should.equal(vector1mPrivate)
  })

  it('should initialize test vector 1 from the extended public key', function () {
    const bip32 = new Bip32().fromString(vector1mPublic)
    should.exist(bip32)
  })

  it('should initialize test vector 1 from the extended private key', function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    should.exist(bip32)
  })

  it('should get the extended public key from the extended private key for test vector 1', function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    bip32
      .toPublic()
      .toString()
      .should.equal(vector1mPublic)
  })

  it("should get m/0' ext. private key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'")
    should.exist(child)
    child.toString().should.equal(vector1m0hPrivate)
  })

  it("should asynchronously get m/0' ext. private key from test vector 1", async function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = await bip32.asyncDerive("m/0'")
    should.exist(child)
    child.toString().should.equal(vector1m0hPrivate)
  })

  it("should get m/0' ext. public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector1m0hPublic)
  })

  it("should get m/0'/1 ext. private key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1")
    should.exist(child)
    child.toString().should.equal(vector1m0h1Private)
  })

  it("should get m/0'/1 ext. public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector1m0h1Public)
  })

  it("should get m/0'/1 ext. public key from m/0' public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'")
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = childPub.derive('m/1')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector1m0h1Public)
  })

  it("should asynchronously get m/0'/1 ext. public key from m/0' public key from test vector 1", async function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'")
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = await childPub.asyncDerive('m/1')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector1m0h1Public)
  })

  it("should get m/0'/1/2h ext. private key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'")
    should.exist(child)
    child.toString().should.equal(vector1m0h12hPrivate)
  })

  it("should get m/0'/1/2h ext. public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector1m0h12hPublic)
  })

  it("should get m/0'/1/2h/2 ext. private key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'/2")
    should.exist(child)
    child.toString().should.equal(vector1m0h12h2Private)
  })

  it("should get m/0'/1/2'/2 ext. public key from m/0'/1/2' public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'")
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = childPub.derive('m/2')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector1m0h12h2Public)
  })

  it("should get m/0'/1/2h/2 ext. public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'/2")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector1m0h12h2Public)
  })

  it("should get m/0'/1/2h/2/1000000000 ext. private key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'/2/1000000000")
    should.exist(child)
    child.toString().should.equal(vector1m0h12h21000000000Private)
  })

  it("should get m/0'/1/2h/2/1000000000 ext. public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'/2/1000000000")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector1m0h12h21000000000Public)
  })

  it("should get m/0'/1/2'/2/1000000000 ext. public key from m/0'/1/2'/2 public key from test vector 1", function () {
    const bip32 = new Bip32().fromString(vector1mPrivate)
    const child = bip32.derive("m/0'/1/2'/2")
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = childPub.derive('m/1000000000')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector1m0h12h21000000000Public)
  })

  it('should initialize test vector 2 from the extended public key', function () {
    const bip32 = new Bip32().fromString(vector2mPublic)
    should.exist(bip32)
  })

  it('should initialize test vector 2 from the extended private key', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    should.exist(bip32)
  })

  it('should get the extended public key from the extended private key for test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    bip32
      .toPublic()
      .toString()
      .should.equal(vector2mPublic)
  })

  it('should get m/0 ext. private key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive('m/0')
    should.exist(child)
    child.toString().should.equal(vector2m0Private)
  })

  it('should get m/0 ext. public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive('m/0')
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector2m0Public)
  })

  it('should get m/0 ext. public key from m public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive('m')
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = childPub.derive('m/0')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector2m0Public)
  })

  it('should get m/0/2147483647h ext. private key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'")
    should.exist(child)
    child.toString().should.equal(vector2m02147483647hPrivate)
  })

  it('should get m/0/2147483647h ext. public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector2m02147483647hPublic)
  })

  it('should get m/0/2147483647h/1 ext. private key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1")
    should.exist(child)
    child.toString().should.equal(vector2m02147483647h1Private)
  })

  it('should get m/0/2147483647h/1 ext. public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector2m02147483647h1Public)
  })

  it('should get m/0/2147483647h/1 ext. public key from m/0/2147483647h public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'")
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = childPub.derive('m/1')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector2m02147483647h1Public)
  })

  it('should get m/0/2147483647h/1/2147483646h ext. private key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1/2147483646'")
    should.exist(child)
    child.toString().should.equal(vector2m02147483647h12147483646hPrivate)
  })

  it('should get m/0/2147483647h/1/2147483646h ext. public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1/2147483646'")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector2m02147483647h12147483646hPublic)
  })

  it('should get m/0/2147483647h/1/2147483646h/2 ext. private key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1/2147483646'/2")
    should.exist(child)
    child.toString().should.equal(vector2m02147483647h12147483646h2Private)
  })

  it('should get m/0/2147483647h/1/2147483646h/2 ext. public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1/2147483646'/2")
    should.exist(child)
    child
      .toPublic()
      .toString()
      .should.equal(vector2m02147483647h12147483646h2Public)
  })

  it('should get m/0/2147483647h/1/2147483646h/2 ext. public key from m/0/2147483647h/2147483646h public key from test vector 2', function () {
    const bip32 = new Bip32().fromString(vector2mPrivate)
    const child = bip32.derive("m/0/2147483647'/1/2147483646'")
    const childPub = new Bip32().fromString(child.toPublic().toString())
    const child2 = childPub.derive('m/2')
    should.exist(child2)
    child2
      .toPublic()
      .toString()
      .should.equal(vector2m02147483647h12147483646h2Public)
  })

  describe('testnet', function () {
    it('should initialize a new Bip32 correctly from a random Bip32', function () {
      const b1 = new Bip32.Testnet()
      b1.fromRandom()
      ;(b1.privKey instanceof PrivKey.Testnet).should.equal(true)
      const b2 = new Bip32.Testnet().fromString(b1.toPublic().toString())
      b2
        .toPublic()
        .toString()
        .should.equal(b1.toPublic().toString())
    })

    it('should generate valid ext pub key for testnet', function () {
      const b = new Bip32.Testnet()
      b.fromRandom()
      ;(b.privKey instanceof PrivKey.Testnet).should.equal(true)
      b
        .toPublic()
        .toString()
        .substring(0, 4)
        .should.equal('tpub')
    })
  })

  describe('#fromObject', function () {
    it('should set this bip32', function () {
      const bip32 = new Bip32().fromString(vector1mPrivate)
      const bip322 = new Bip32().fromObject({
        versionBytesNum: bip32.versionBytesNum,
        depth: bip32.depth,
        parentFingerPrint: bip32.parentFingerPrint,
        childIndex: bip32.childIndex,
        chainCode: bip32.chainCode,
        privKey: bip32.privKey,
        pubKey: bip32.pubKey,
        hasPrivKey: bip32.hasPrivKey
      })
      bip322.toString().should.equal(bip32.toString())
      bip322
        .fromObject({})
        .toString()
        .should.equal(bip32.toString())
    })
  })

  describe('#fromRandom', function () {
    it('should not return the same one twice', function () {
      const bip32a = new Bip32().fromRandom()
      const bip32b = new Bip32().fromRandom()
      bip32a.toString().should.not.equal(bip32b.toString())
    })
  })

  describe('@fromRandom', function () {
    it('should not return the same one twice', function () {
      const bip32a = Bip32.fromRandom()
      const bip32b = Bip32.fromRandom()
      bip32a.toString().should.not.equal(bip32b.toString())
    })
  })

  describe('#fromSeed', function () {
    it('should initialize a new Bip32 correctly from test vector 1 seed', function () {
      const hex = vector1master
      const bip32 = new Bip32().fromSeed(Buffer.from(hex, 'hex'), 'mainnet')
      should.exist(bip32)
      bip32.toString().should.equal(vector1mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector1mPublic)
    })

    it('should initialize a new Bip32 correctly from test vector 2 seed', function () {
      const hex = vector2master
      const bip32 = new Bip32().fromSeed(Buffer.from(hex, 'hex'), 'mainnet')
      should.exist(bip32)
      bip32.toString().should.equal(vector2mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector2mPublic)
    })
  })

  describe('@fromSeed', function () {
    it('should initialize a new Bip32 correctly from test vector 1 seed', function () {
      const hex = vector1master
      const bip32 = Bip32.fromSeed(Buffer.from(hex, 'hex'), 'mainnet')
      should.exist(bip32)
      bip32.toString().should.equal(vector1mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector1mPublic)
    })

    it('should initialize a new Bip32 correctly from test vector 2 seed', function () {
      const hex = vector2master
      const bip32 = Bip32.fromSeed(Buffer.from(hex, 'hex'), 'mainnet')
      should.exist(bip32)
      bip32.toString().should.equal(vector2mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector2mPublic)
    })
  })

  describe('#asyncFromSeed', function () {
    it('should initialize a new Bip32 correctly from test vector 1 seed', async function () {
      const hex = vector1master
      const bip32 = await new Bip32().asyncFromSeed(
        Buffer.from(hex, 'hex'),
        'mainnet'
      )
      should.exist(bip32)
      bip32.toString().should.equal(vector1mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector1mPublic)
    })

    it('should initialize a new Bip32 correctly from test vector 2 seed', async function () {
      const hex = vector2master
      const bip32 = await new Bip32().asyncFromSeed(
        Buffer.from(hex, 'hex'),
        'mainnet'
      )
      should.exist(bip32)
      bip32.toString().should.equal(vector2mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector2mPublic)
    })
  })

  describe('@asyncFromSeed', function () {
    it('should initialize a new Bip32 correctly from test vector 1 seed', async function () {
      const hex = vector1master
      const bip32 = await Bip32.asyncFromSeed(Buffer.from(hex, 'hex'), 'mainnet')
      should.exist(bip32)
      bip32.toString().should.equal(vector1mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector1mPublic)
    })

    it('should initialize a new Bip32 correctly from test vector 2 seed', async function () {
      const hex = vector2master
      const bip32 = await Bip32.asyncFromSeed(Buffer.from(hex, 'hex'), 'mainnet')
      should.exist(bip32)
      bip32.toString().should.equal(vector2mPrivate)
      bip32
        .toPublic()
        .toString()
        .should.equal(vector2mPublic)
    })
  })

  describe('#fromHex', function () {
    it('should make a bip32 from a hex string', function () {
      const str =
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const buf = Base58Check.decode(str)
      const hex = buf.toString('hex')
      let bip32 = new Bip32().fromHex(hex)
      should.exist(bip32)
      bip32.toString().should.equal(str)
      bip32 = bip32.toPublic()
      const xpub = bip32.toString()
      bip32 = new Bip32().fromHex(bip32.toHex())
      bip32.toString().should.equal(xpub)
    })
  })

  describe('#fromBuffer', function () {
    it('should make a bip32 from a buffer', function () {
      const str =
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const buf = Base58Check.decode(str)
      let bip32 = new Bip32().fromBuffer(buf)
      should.exist(bip32)
      bip32.toString().should.equal(str)
      bip32 = bip32.toPublic()
      const xpub = bip32.toString()
      bip32 = new Bip32().fromBuffer(bip32.toBuffer())
      bip32.toString().should.equal(xpub)
    })
  })

  describe('#toHex', function () {
    it('should return a bip32 hex string', function () {
      const str =
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const hex = Base58Check.decode(str).toString('hex')
      const bip32 = new Bip32().fromString(str)
      bip32.toHex().should.equal(hex)
    })
  })

  describe('#toBuffer', function () {
    it('should return a bip32 buffer', function () {
      const str =
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const buf = Base58Check.decode(str)
      const bip32 = new Bip32().fromString(str)
      bip32
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })
  })

  describe('#fromString', function () {
    it('should make a bip32 from a string', function () {
      const str =
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const bip32 = new Bip32().fromString(str)
      should.exist(bip32)
      bip32.toString().should.equal(str)
    })
  })

  describe('#asyncFromString', function () {
    it('should make a bip32 from a string asynchronously', async function () {
      const str =
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const bip32 = new Bip32().fromString(str)
      should.exist(bip32)
      const bip32b = await new Bip32().asyncFromString(str)
      bip32.toString().should.equal(str)
      bip32.toString().should.equal(bip32b.toString())
    })
  })

  describe('#toString', function () {
    const bip32 = new Bip32()
    bip32.fromRandom()
    const tip32 = new Bip32.Testnet()
    tip32.fromRandom()

    it('should return an xprv string', function () {
      bip32
        .toString()
        .slice(0, 4)
        .should.equal('xprv')
    })

    it('should return an xpub string', function () {
      bip32
        .toPublic()
        .toString()
        .slice(0, 4)
        .should.equal('xpub')
    })

    it('should return a tprv string', function () {
      tip32
        .toString()
        .slice(0, 4)
        .should.equal('tprv')
      ;(tip32.privKey instanceof PrivKey.Testnet).should.equal(true)
    })

    it('should return a tpub string', function () {
      tip32
        .toPublic()
        .toString()
        .slice(0, 4)
        .should.equal('tpub')
    })
  })

  describe('#asyncToString', function () {
    it('should convert to a string same as toString', async function () {
      const bip32 = new Bip32().fromRandom()
      const str1 = bip32.toString()
      const str2 = await bip32.asyncToString()
      str1.should.equal(str2)
    })
  })

  describe('#toJSON', function () {
    it('should be the same as toFastHex', function () {
      const bip32 = Bip32.fromRandom()
      bip32.toJSON().should.equal(bip32.toFastHex())
    })
  })

  describe('#fromJSON', function () {
    it('should be the same as fromFastHex', function () {
      const bip32 = Bip32.fromRandom()
      const hex = bip32.toHex()
      const bip32a = new Bip32().fromJSON(hex)
      const bip32b = new Bip32().fromFastHex(hex)
      bip32a.toString().should.equal(bip32b.toString())
    })
  })

  describe('@fromJSON', function () {
    it('should be the same as fromFastHex', function () {
      const bip32 = Bip32.fromRandom()
      const hex = bip32.toHex()
      const bip32a = Bip32.fromJSON(hex)
      const bip32b = Bip32.fromFastHex(hex)
      bip32a.toString().should.equal(bip32b.toString())
    })
  })

  describe('#isPrivate', function () {
    it('should know if this bip32 is private', function () {
      const bip32priv = new Bip32().fromRandom()
      const bip32pub = bip32priv.toPublic()
      bip32priv.isPrivate().should.equal(true)
      bip32pub.isPrivate().should.equal(false)
    })
  })
})
