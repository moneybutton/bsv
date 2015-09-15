/** ECIES (experimental)
 * =====================
 * http://en.wikipedia.org/wiki/Integrated_Encryption_Scheme
 */
'use strict'
let dependencies = {
  AESCBC: require('./aescbc'),
  cmp: require('./cmp'),
  Hash: require('./hash'),
  Keypair: require('./keypair'),
  Point: require('./point'),
  Privkey: require('./privkey'),
  Pubkey: require('./pubkey')
}

function inject (deps) {
  let AESCBC = deps.AESCBC
  let cmp = deps.cmp
  let Hash = deps.Hash
  let Keypair = deps.Keypair
  let Point = deps.Point
  let Privkey = deps.Privkey
  let Pubkey = deps.Pubkey

  function ECIES () {
    if (!(this instanceof ECIES))
      return new ECIES()
  }

  ECIES.encrypt = function (messagebuf, topubkey, fromkeypair, ivbuf) {
    if (!fromkeypair)
      fromkeypair = Keypair().fromRandom()
    let r = fromkeypair.privkey.bn
    let R = fromkeypair.pubkey.point
    let Rpubkey = fromkeypair.pubkey
    let Rbuf = Rpubkey.toDER(true)
    let KB = topubkey.point
    let P = KB.mul(r)
    let S = P.getX()
    let Sbuf = S.toBuffer({size: 32})
    let kEkM = Hash.sha512(Sbuf)
    let kE = kEkM.slice(0, 32)
    let kM = kEkM.slice(32, 64)
    let c = AESCBC.encrypt(messagebuf, kE, ivbuf)
    let d = Hash.sha256hmac(c, kM)
    let encbuf = Buffer.concat([Rbuf, c, d])
    return encbuf
  }

  ECIES.decrypt = function (encbuf, toprivkey) {
    let kB = toprivkey.bn
    let frompubkey = Pubkey().fromDER(encbuf.slice(0, 33))
    let R = frompubkey.point
    let P = R.mul(kB)
    if (P.eq(new Point()))
      throw new Error('P equals 0')
    let S = P.getX()
    let Sbuf = S.toBuffer({size: 32})
    let kEkM = Hash.sha512(Sbuf)
    let kE = kEkM.slice(0, 32)
    let kM = kEkM.slice(32, 64)
    let c = encbuf.slice(33, encbuf.length - 32)
    let d = encbuf.slice(encbuf.length - 32, encbuf.length)
    let d2 = Hash.sha256hmac(c, kM)
    if (!cmp(d, d2))
      throw new Error('Invalid checksum')
    let messagebuf = AESCBC.decrypt(c, kE)
    return messagebuf
  }

  return ECIES
}

inject = require('./injector')(inject, dependencies)
let ECIES = inject()
ECIES.Mainnet = inject({
  Keypair: require('./keypair').Mainnet,
  Privkey: require('./privkey').Mainnet
})
ECIES.Testnet = inject({
  Keypair: require('./keypair').Testnet,
  Privkey: require('./privkey').Testnet
})
module.exports = ECIES
