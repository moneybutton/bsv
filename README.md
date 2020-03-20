bsv
===

Javascript Bitcoin SV library.

Documentation is available on the [Money Button Documentation Page](https://docs.moneybutton.com/docs/bsv-overview.html).

Changelog
---------
**1.5.0**
* Add build files into repo.

**1.4.0**
* Change default fee to 0.5 sat/byte

**1.3.0**
* Remove limit on OP_RETURN size

**1.1.0**
* Refactor code related to buffers and get rid of bufferUtil
* Deprecate p2sh
* Add .Mnemonic to bsv object

**1.0.0**
* Bump to 1.0 release as per the suggestion of @mathiasrw

**0.30.2**
* Added addSafeData to Transaction.

**0.30.1**
* Enforce buffer check for Electrum ECIES decryption.
* Clean up script folder (no API breaking changes).
* Documentation improvements.

**0.30.0**
* Fix transaction size calculation.

**0.29.2**
* Throw error on invalid hex strings in script

**0.29.1**
* Add support for new OP_RETURN style: buildSafeDataOut and isSafeDataOut (and getData)

**0.27.2**
* Add support for Stress Test Network (STN).

**v0.27.1**
* Replace lodash methods with inline pure javascript methods.

**v0.27.0**
* Remove version guard. This should fix the "two versions of bsv" error that
  people often get. Note that it is poor practice to use incompatible versions
  of bsv. To send objects from one version of the library to another, always
  serialize to a string or buffer first. Do not send objects from one version to
  another. This due to frequent use of "instanceof" inside the library.

**v0.26.5**
* lodash optimization and overall size optimization of bsv.min.js
* fix isFinal
* fix non-dust amount example
* minor ECIES API issue

**v0.26.4**
* Use ECDSA.signWithCalcI(...) convenience method inside Message.

**v0.26.3**
* Add ECDSA.signWithCalcI(...) convenience method.

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
