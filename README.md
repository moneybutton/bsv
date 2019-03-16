bsv
===

Javascript Bitcoin SV library.

Documentation is available on the [Money Button Documentation Page](https://docs.moneybutton.com/docs/bsv-overview.html).

Changelog
---------

**v0.26.2**
* Add Mnemonic.fromString(string).
* Add convenience method for ECDSA.signRandomK (mostly for demo purposes).
* Add convenience methods Message.sign and message.verify.
* Move large portions of the documentation to [docs.moneybutton.com](https://docs.moneybutton.com).

**v0.26.1**
* Add .fromRandom() method for Mnemonic.

**v0.26.0**
* Remove the (already deprecated) .derive() method from HDPrivateKey and HDPublicKey. If you rely on this, please switch to .deriveNonCompliantChild(). If you do not already rely on this, you should use .deriveChild() instead.
* Move large portions of the documentation to [docs.moneybutton.com](https://docs.moneybutton.com).
* HDPrivateKey / HDPublicKey toHex() and fromHex()
* HDPrivateKey.fromRandom()
* Remove Base32 (this was only used for cashaddr and is now obsolete).

**v0.25.0**
* Remove support for cashaddr completely. This saves size in the bundle.
* Private key .toString() method now returns WIF, which makes it compatible with the corresponding .fromString(wif) method.
* Private key and public key classes now have toHex() and fromHex(hex) methods.
* Move large portions of the documentation to [docs.moneybutton.com](https://docs.moneybutton.com).
