'use strict'
var _ = require('./util/_')

var JSUtil = require('./util/js')
var networks = []
var networkMaps = {}

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet"), "testnet", "regtest" and "stn".
 * @constructor
 */
function Network () {}

Network.prototype.toString = function toString () {
  return this.name
}

/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @return Network
 */
function get (arg, keys) {
  if (~networks.indexOf(arg)) {
    return arg
  }
  if (keys) {
    if (!_.isArray(keys)) {
      keys = [keys]
    }
    for (var i = 0; i < networks.length; i++) {
      var network = networks[i]
      var filteredNet = _.pick(network, keys)
      var netValues = _.values(filteredNet)
      if (~netValues.indexOf(arg)) {
        return network
      }
    }
    return undefined
  }
  return networkMaps[arg]
}

/***
 * Derives an array from the given cashAddrPrefix to be used in the computation
 * of the address' checksum.
 *
 * @param {string} cashAddrPrefix Network cashAddrPrefix. E.g.: 'bitcoincash'.
 */
function cashAddrPrefixToArray (cashAddrPrefix) {
  var result = []
  for (var i = 0; i < cashAddrPrefix.length; i++) {
    result.push(cashAddrPrefix.charCodeAt(i) & 31)
  }
  return result
}

/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash cashAddrPrefix
 * @param {Number} data.privatekey - The privatekey cashAddrPrefix
 * @param {Number} data.scripthash - The scripthash cashAddrPrefix
 * @param {Number} data.xpubkey - The extended public key magic
 * @param {Number} data.xprivkey - The extended private key magic
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return Network
 */
function addNetwork (data) {
  var network = new Network()

  JSUtil.defineImmutable(network, {
    name: data.name,
    alias: data.alias,
    pubkeyhash: data.pubkeyhash,
    privatekey: data.privatekey,
    scripthash: data.scripthash,
    xpubkey: data.xpubkey,
    xprivkey: data.xprivkey
  })

  var indexBy = data.indexBy || Object.keys(data)

  if (data.cashAddrPrefix) {
    _.extend(network, {
      cashAddrPrefix: data.cashAddrPrefix,
      cashAddrPrefixArray: cashAddrPrefixToArray(data.cashAddrPrefix)
    })
  }

  if (data.networkMagic) {
    _.extend(network, {
      networkMagic: JSUtil.integerAsBuffer(data.networkMagic)
    })
  }

  if (data.port) {
    _.extend(network, {
      port: data.port
    })
  }

  if (data.dnsSeeds) {
    _.extend(network, {
      dnsSeeds: data.dnsSeeds
    })
  }
  networks.push(network)
  indexNetworkBy(network, indexBy)
  return network
}

function indexNetworkBy (network, keys) {
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var networkValue = network[key]
    if (!_.isUndefined(networkValue) && !_.isObject(networkValue)) {
      networkMaps[networkValue] = network
    }
  }
}

function unindexNetworkBy (network, values) {
  for (var index = 0; index < values.length; index++) {
    var value = values[index]
    if (networkMaps[value] === network) {
      delete networkMaps[value]
    }
  }
}

/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
function removeNetwork (network) {
  for (var i = 0; i < networks.length; i++) {
    if (networks[i] === network) {
      networks.splice(i, 1)
    }
  }
  unindexNetworkBy(network, Object.keys(networkMaps))
}

var networkMagic = {
  livenet: 0xe3e1f3e8,
  testnet: 0xf4e5f3f4,
  regtest: 0xdab5bffa,
  stn: 0xfbcec4f9
}

var dnsSeeds = [
  'seed.bitcoinsv.org',
  'seed.bitcoinunlimited.info'
]

var TESTNET = {
  PORT: 18333,
  NETWORK_MAGIC: networkMagic.testnet,
  DNS_SEEDS: dnsSeeds,
  PREFIX: 'testnet',
  CASHADDRPREFIX: 'bchtest'
}

var REGTEST = {
  PORT: 18444,
  NETWORK_MAGIC: networkMagic.regtest,
  DNS_SEEDS: [],
  PREFIX: 'regtest',
  CASHADDRPREFIX: 'bchreg'
}

var STN = {
  PORT: 9333,
  NETWORK_MAGIC: networkMagic.stn,
  DNS_SEEDS: ['stn-seed.bitcoinsv.io'],
  PREFIX: 'stn',
  CASHADDRPREFIX: 'bsvstn'
}

var liveNetwork = {
  name: 'livenet',
  alias: 'mainnet',
  prefix: 'bitcoin',
  cashAddrPrefix: 'bitcoincash',
  pubkeyhash: 0x00,
  privatekey: 0x80,
  scripthash: 0x05,
  xpubkey: 0x0488b21e,
  xprivkey: 0x0488ade4,
  networkMagic: networkMagic.livenet,
  port: 8333,
  dnsSeeds: dnsSeeds
}

// network magic, port, cashAddrPrefix, and dnsSeeds are overloaded by enableRegtest
var testNetwork = {
  name: 'testnet',
  prefix: TESTNET.PREFIX,
  cashAddrPrefix: TESTNET.CASHADDRPREFIX,
  pubkeyhash: 0x6f,
  privatekey: 0xef,
  scripthash: 0xc4,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  networkMagic: TESTNET.NETWORK_MAGIC
}

var regtestNetwork = {
  name: 'regtest',
  prefix: REGTEST.PREFIX,
  cashAddrPrefix: REGTEST.CASHADDRPREFIX,
  pubkeyhash: 0x6f,
  privatekey: 0xef,
  scripthash: 0xc4,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  networkMagic: REGTEST.NETWORK_MAGIC,
  port: REGTEST.PORT,
  dnsSeeds: [],
  indexBy: [
    'port',
    'name',
    'cashAddrPrefix',
    'networkMagic'
  ]
}
var stnNetwork = {
  name: 'stn',
  prefix: STN.PREFIX,
  cashAddrPrefix: STN.CASHADDRPREFIX,
  pubkeyhash: 0x6f,
  privatekey: 0xef,
  scripthash: 0xc4,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  networkMagic: STN.NETWORK_MAGIC,
  indexBy: [
    'port',
    'name',
    'cashAddrPrefix',
    'networkMagic'
  ]
}
// Add configurable values for testnet/regtest

addNetwork(testNetwork)
addNetwork(stnNetwork)
addNetwork(regtestNetwork)
addNetwork(liveNetwork)

var livenet = get('livenet')
var regtest = get('regtest')
var testnet = get('testnet')
var stn = get('stn')

Object.defineProperty(testnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.PORT
    } else if (this.stnEnabled) {
      return STN.PORT
    } else {
      return TESTNET.PORT
    }
  }
})

Object.defineProperty(testnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return JSUtil.integerAsBuffer(REGTEST.NETWORK_MAGIC)
    } else if (this.stnEnabled) {
      return JSUtil.integerAsBuffer(STN.NETWORK_MAGIC)
    } else {
      return JSUtil.integerAsBuffer(TESTNET.NETWORK_MAGIC)
    }
  }
})

Object.defineProperty(testnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.DNS_SEEDS
    } else if (this.stnEnabled) {
      return STN.DNS_SEEDS
    } else {
      return TESTNET.DNS_SEEDS
    }
  }
})

Object.defineProperty(testnet, 'cashAddrPrefix', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.CASHADDRPREFIX
    } else if (this.stnEnabled) {
      return STN.CASHADDRPREFIX
    } else {
      return TESTNET.CASHADDRPREFIX
    }
  }
})

Object.defineProperty(testnet, 'cashAddrPrefixArray', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return cashAddrPrefixToArray(REGTEST.CASHADDRPREFIX)
    } else if (this.stnEnabled) {
      return STN.cashAddrPrefixToArray(STN.CASHADDRPREFIX)
    } else {
      return cashAddrPrefixToArray(TESTNET.CASHADDRPREFIX)
    }
  }
})

/**
 * @function
 * @member Networks#enableRegtest
 * Will enable regtest features for testnet
 */
function enableRegtest () {
  testnet.regtestEnabled = true
}

/**
 * @function
 * @member Networks#disableRegtest
 * Will disable regtest features for testnet
 */
function disableRegtest () {
  testnet.regtestEnabled = false
}
/**
 * @function
 * @member Networks#enableStn
 * Will enable stn features for testnet
 */
function enableStn () {
  testnet.stnEnabled = true
}

/**
 * @function
 * @member Networks#disableStn
 * Will disable stn features for testnet
 */
function disableStn () {
  testnet.stnEnabled = false
}

/**
 * @namespace Networks
 */
module.exports = {
  add: addNetwork,
  remove: removeNetwork,
  defaultNetwork: livenet,
  livenet: livenet,
  mainnet: livenet,
  testnet: testnet,
  regtest: regtest,
  stn: stn,
  get: get,
  enableRegtest: enableRegtest,
  disableRegtest: disableRegtest,
  enableStn: enableStn,
  disableStn: disableStn
}
