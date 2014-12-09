fullnode (alpha)
================

fullnode is a javascript implementation of bitcoin intended to satisfy certain
goals:

1. Support ease-of-use by being internally consistent. It should not be
necessary to read the source code of a class or function to know how to use it.

2. Have 100% test coverage, or nearly so, so that the library is known to be
reliable. This should include running standard test vectors from bitcoin core.

3. Library objects have an interface suitable for use with a command-line
interface and API, in particular having toString, fromString, toJSON, fromJSON,
methods. Other common methods are toBuffer, fromBuffer relevant for binary
formats such as transactions and blocks.

4. All standard features of the bitcoin protocol are implemented and saved in
lib/. All BIPs are correctly implemented and, where appropriate, saved as
bipxx.js in lib/ (since that is their standard name). Any non-standard features
(such as colored coins or stealth addresses) are placed in the lib/expmt/
folder and are accessible at fullnode.expmt. Once they are standardized and
given a BIP, they are renamed and placed in lib/.

5. It is always possible to create a new object without using "new".

6. Compatible with browserify (i.e., using require('fullnode/lib/message')
should work both in node, and be automatically work in the browser with used in
conjunction with browserify).

7. Minimize the use of dependencies so that all code can be easily audited.

8. All instance methods modify the state of the object and return the object,
unless there is a good reason to do something different.  To access the result
of an instance method, you must access the object property(s) that it modifies.

-------------------------
Notable features:
* 90%+ test coverage
* Browserifiable
* Stealth keys, addresses, message
* Bitcoin-style message signing and verification
* Exposed big number and point classes
* Deterministic k (deterministic signatures; RFC 6979)
* Script interpreter, validated against bitcoind tests

## Documentation ##

```
npm install -g groc
groc
```

## Testing and Coverage ##

```
npm install -g mocha
npm install -g istanbul
npm test
```

You can see the coverage report at coverage/lcov-report/index.html.

Or, to build tests for the browser:

```
browser/build
```

Then open test/index.html in your browser.

## Browser bundle ##

```
npm install -g browserify
npm install -g uglifyify
browser/build
```
