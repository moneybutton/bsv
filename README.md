fullnode (alpha)
================

fullnode is an ES6 (javascript) implementation of bitcoin intended to satisfy
certain goals:

1. Bring the bitcoin p2p network and blockchain to web browsers and
   node.js/io.js in a decentralized, trust-minimized manner, without the
   required use of a third-party API.

2. Support ease-of-use by being internally consistent. It should not be
   necessary to read the source code of a class or function to know how to use
   it.  Once you know how to use part of the library, the other parts should
   feel natural.

3. Have 100% test coverage, or nearly so, so that the library is known to be
   reliable. This should include running standard test vectors from bitcoin
   core.

4. Library objects have an interface suitable for use with a command-line
   interface or other libraries and tools, in particular having toString,
   fromString, toJSON, fromJSON, toBuffer, fromBuffer, toHex, fromHex methods.
   It should be possible to mix fullnode with bitcoinjs-lib or bitcore or even
   libraries from other languages if developers find that useful.

5. All standard features of the bitcoin protocol are implemented (or will be)
   and saved in lib/. All BIPs are correctly implemented and, where
   appropriate, saved as bipxx.js in lib/ (since that is their standard name).
   In order to allow rapid development, fullnode includes non-standard and
   experimental features. Any non-standard features (such as colored coins or
   stealth addresses) are labeled as such in index.js as well as in comments.

6. Expose everything, including dependencies. This makes it possible to develop
   apps that require fine-grained control over the basics, such as big numbers
   and points. However, it also means that you can hurt yourself if you misuse
   these primitives.

7. It is always possible to create a new object without using "new".

8. Minimize the use of dependencies so that all code can be easily audited.

9. All instance methods modify the state of the object and return the object,
   unless there is a good reason to do something different.  To access the
   result of an instance method, you must access the object property(s) that it
   modifies.

10. Use the features of ES6 (ECMAScript 6, the latest version of javascript)
    available in the latest stable releases of io.js. fullnode is not intended
    to work with node.js 0.10 or node.js 0.12, except through a build process.
    Once the merger of io.js and node.js is completed, we will migrate to use
    whatever features are available in that new version of node.js (which will
    probably be what is available in io.js today).

## Alpha Caveat ##

fullnode is still alpha, and has an unstable API. Once the API has been
finalized, and the code audited, version 1.0 will be released. It is
recommended not to use fullnode for production software until that time.

## Documentation ##

While fullnode is under heavy development, the API changes frequently, and the
documentation is not kept up-to-date. However there is some documentation, and
it can be built with groc:

```
npm install -g groc
groc
```

## License ##

In order to support maximum interoperability with other software, fullnode is
MIT-licensed. See LICENSE.
