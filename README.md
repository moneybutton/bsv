Yours Bitcoin
=============

Yours Bitcoin is a javascript implementation of bitcoin intended to satisfy
certain goals:

1. Bring the blockchain to web browsers and node.js in a decentralized,
trust-minimized manner, without the required use of a third-party API.

2. Support ease-of-use by being internally consistent. It should not be
necessary to read the source code of a class or function to know how to use it.
Once you know how to use part of the library, the other parts should feel
natural.

3. Have 100% test coverage, or nearly so, so that the library is known to be
reliable. This should include running standard test vectors from the reference
implementation.

4. Library objects have an interface suitable for use with a command-line
interface or other libraries and tools, in particular having toString,
fromString, toJSON, fromJSON, toBuffer, fromBuffer, toHex, fromHex methods.

5. All standard features of the blockchain are implemented (or will be) and
saved in lib/. All BIPs are correctly implemented and, where appropriate, saved
as bip-xx.js in lib/ (since that is their standard name). In order to allow
rapid development, Yours Bitcoin includes non-standard and experimental
features.  Any non-standard features (such as colored coins or stealth
addresses) are labeled as such in index.js as well as in comments.

6. Expose everything, including dependencies. This makes it possible to develop
apps that require fine-grained control over the basics, such as big numbers and
points. However, it also means that you can hurt yourself if you misuse these
primitives.

7. Use standard javascript conventions wherever possible so that other
developers find the code easy to understand.

8. Minimize the use of dependencies so that all code can be easily audited.

9. All instance methods modify the state of the object and return the object,
unless there is a good reason to do something different. To access the result
of an instance method, you must access the object property(s) that it modifies.

Yours Bitcoin is still being developed and does not yet support downloading the
blockchain.

Environment Variables
---------------------
- `YOURS_BITCOIN_JS_BASE_URL` - Default "/".
- `YOURS_BITCOIN_JS_BUNDLE_FILE` - Default "yours-bitcoin.js"
- `YOURS_BITCOIN_JS_WORKER_FILE` - Default "yours-bitcoin-worker.js"
- `YOURS_BITCOIN_JS_BUNDLE_MIN_FILE` - Default "yours-bitcoin-min.js"
- `YOURS_BITCOIN_JS_WORKER_MIN_FILE` - Default "yours-bitcoin-worker-min.js"
- `YOURS_BITCOIN_NETWORK` - Default "mainnet"

You can change the network to run the CLI in testnet mode:
```
YOURS_BITCOIN_NETWORK=testnet ./bin/yours-bitcoin.js
```

Documentation
-------------

While Yours Bitcoin is under heavy development, the API changes frequently, and
the documentation is not kept up-to-date. However there is some documentation,
and it can be built with groc:

```
npm install -g groc
groc
```

Database Proposal
-----------------
```
block-[blockHashBuf]:[height][blockBuf]
height-[height][blockHashBuf]:[workSum]
work-[workSum][blockHashBuf]:
tx-[txHashBuf]:[txBuf]
address-[addressBuf]:[satoshiDiffBn, height, blockHashBuf, txHashBuf] (removed on reorg)
chain-[height]:[blockHashBuf] (removed on reorg)
```
