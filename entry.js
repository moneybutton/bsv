/**
 * bsv
 * ===
 *
 * entry.js is the entry point for a the js bundlers.
 * Webpack and microbundlers, both start use this file as
 * the entry point to bundle the entire library.
 */
import aes from 'aes'
import bnjs from 'bn.js'
import bs58 from 'bs58'

import elliptic from 'bitcoin-elliptic'
import hashjs from 'hash.js'
import pbkdf2 from 'pbkdf2'

// version string.
import pkgInfo from './package.json'

// Dependencies, subject to change.
const deps = {
  aes,
  bnjs,
  bs58,
  elliptic,
  hashjs,
  pbkdf2,
  Buffer
}

export { deps }
const version = pkgInfo.version
export { version }

// Main bitcoin library - bitcoin protocols, standards, cryptography, and
// utilities.
export * from './lib/address'
export * from './lib/bip-32'
export * from './lib/bip-39'
export * from './lib/bip-39-words'
export * from './lib/bn'
export * from './lib/br'
export * from './lib/bsm'
export * from './lib/bw'
export * from './lib/base-58'
export * from './lib/base-58-check'
export * from './lib/block'
export * from './lib/block-header'
export * from './lib/constants'
export * from './lib/ecdsa'
export * from './lib/hash'
export * from './lib/interp'
export * from './lib/key-pair'
export * from './lib/op-code'
export * from './lib/point'
export * from './lib/priv-key'
export * from './lib/pub-key'
export * from './lib/random'
export * from './lib/script'
export * from './lib/sig'
export * from './lib/sig-operations'
export * from './lib/struct'
export * from './lib/tx'
export * from './lib/tx-builder'
export * from './lib/tx-in'
export * from './lib/tx-out'
export * from './lib/tx-out-map'
export * from './lib/tx-verifier'
export * from './lib/var-int'
export * from './lib/workers'
export * from './lib/workers-result'
export * from './lib/cmp'

// Encryption tools. Some bitcoin standards use Aes encryption, so that's why
// these are available.
export * from './lib/ach'
export * from './lib/aes'
export * from './lib/aescbc'
export * from './lib/cbc'
export * from './lib/ecies'
