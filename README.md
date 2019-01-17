bsvjs
=====

A pure and powerful JavaScript Bitcoin *SV* library.

## Principles

Bitcoin SV is an other powerful  peer-to-peer platform for the next generation of financial technology. The decentralized nature of the Bitcoin network allows for highly resilient bitcoin infrastructure, and the developer community needs reliable, open-source tools to implement bitcoin apps and services.


## Bitcoin SV changes

Bitcoin sv uses a different `sighash` for transaction signatures. The implementation in bitcore-sv has been tested agains the original bitcoin-sv test vectors (see sighash.json in `/test`). `bitcoin-sv` modifications in script evaluation has not been implemented yet.

An usage example of bsv can be seen at https://github.com/bitpay/copay-recovery

## Get Started

**In node.js**

```
npm install bsv
```


Adding Bitcore SV to your app's `package.json`:

``` json
  "dependencies": {
         "bsv": "=0.18.0",
          ...
          }
```

**In browser**

```html
<script src='https://unpkg.com/bsv'></script>
```

## Documentation

The complete docs are hosted here: [bitcore documentation](http://bitcore.io/guide/). There's also a [bitcore API reference](http://bitcore.io/api/) available generated from the JSDocs of the project, where you'll find low-level details on each bitcore utility.

- [Read the Developer Guide](http://bitcore.io/guide/)
- [Read the API Reference](http://bitcore.io/api/)

To get community assistance and ask for help with implementation questions, please use our [community forums](https://forum.bitcore.io/).

## Examples

* [Generate a random address](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#generate-a-random-address)
* [Generate a address from a SHA256 hash](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#generate-a-address-from-a-sha256-hash)
* [Import an address via WIF](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#import-an-address-via-wif)
* [Create a Transaction](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#create-a-transaction)
* [Sign a Bitcoin message](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#sign-a-bitcoin-message)
* [Verify a Bitcoin message](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#verify-a-bitcoin-message)
* [Create an OP RETURN transaction](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#create-an-op-return-transaction)
* [Create a 2-of-3 multisig P2SH address](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#create-a-2-of-3-multisig-p2sh-address)
* [Spend from a 2-of-2 multisig P2SH address](https://github.com/moneybutton/bsv/blob/master/docs/examples.md#spend-from-a-2-of-2-multisig-p2sh-address)


## Security

We're using Bitcore in production, as are [many others](http://bitcore.io#projects), but please use common sense when doing anything related to finances! We take no responsibility for your implementation decisions.

If you find a security issue, please email security@bitpay.com.

## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. For more information on how to contribute, please refer to our [CONTRIBUTING](https://github.com/moneybutton/bsv/blob/master/CONTRIBUTING.md) file.

## Building the Browser Bundle

**Build with Gulp**

To build a bitcore-lib full bundle for the browser:

```sh
gulp browser
```

This will generate files named `bitcore-lib.js` and `bitcore-lib.min.js`.

You can also use our pre-generated files, provided for each release along with a PGP signature by one of the project's maintainers. To get them, checkout a release commit (for example, https://github.com/moneybutton/bsv/commit/e33b6e3ba6a1e5830a079e02d949fce69ea33546 for v0.12.6).

To verify signatures, use the following PGP keys:
- @gabegattis: https://pgp.mit.edu/pks/lookup?op=get&search=0x441430987182732C `F3EA 8E28 29B4 EC93 88CB  B0AA 4414 3098 7182 732C`
- @matiu: https://pgp.mit.edu/pks/lookup?op=get&search=0x9EDE6DE4DE531FAC `25CE ED88 A1B1 0CD1 12CD  4121 9EDE 6DE4 DE53 1FAC`

**Build with Webpack**

~~~
npm run wpbuild
~~~

This will generate file named `bsv.min.js`.

## Development & Tests

```sh
git clone https://github.com/moneybutton/bsv
cd bsv
npm install
```

Run all the tests:

```sh
gulp test
```

You can also run just the Node.js tests with `gulp test:node`, just the browser tests with `gulp test:browser`
or create a test coverage report (you can open `coverage/lcov-report/index.html` to visualize it) with `gulp coverage`.

## License

Code released under [the MIT license](https://github.com/bitpay/bitcore-lib/blob/master/LICENSE).

Copyright 2013-2018 BitPay, Inc. Bitcore is a trademark maintained by BitPay, Inc.
