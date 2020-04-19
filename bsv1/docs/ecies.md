# ECIES
`bsv/ecies` is a library that work with bsv's private/public keys. 

It provide electrum compatible ECIES message by default.

## Options
The constructor accept several options

- `ephemeralKey`: should use ephemeral private key to encrypt message. `true` by default. It's set to `false` automatically if you provide private key later.
- `noKey`: should exclude encrypt public key in message. `false` by default, disabled if `ephemeralKey` is `true`. Typically, public key is included in message, so receiver need only his private key to decrypt. Receiver must use same option with sender, in order to decrypt message properly. 
- `shortTag`: should use shorten HMAC in message. `false` by default. Receiver must use same option with sender, in order to decrypt message properly.

## Examples

### Message to Bob

```javascript
var bsv = require('bsv')
var IES = require('bsv/ecies')

var bob = bsv.PrivateKey()
var bobPubkey = bob.publicKey

// Send a message to bob
var enc = new IES().publicKey(bobPubkey).encrypt('a message')
// Bob decrypt a message
var dec = new IES().privateKey(bob).decrypt(enc)
```

### Messages between Alice and Bob

~~~javascript
var bsv = require('bsv')
var IES = require('bsv/ecies')

var alice = bsv.PrivateKey()
var alicePubkey = alice.publicKey
var bob = bsv.PrivateKey()
var bobPubkey = bob.publicKey

var iesAlice = new IES({'nokey':true}).privateKey(alice).publicKey(bobPubkey)

var iesBob = new IES({'nokey':true}).privateKey(bob).publicKey(alicePubkey)

messageAlice = iesAlice.encrypt('Hello Bob')
messageAliceDec = iesBob.decrypt(messageAlice)

messageBob = iesBob.encrypt('Hi Alice')
messageBobDec = iesAlice.decrypt(messageBob)
~~~

### Recover messages

Sender can recover messages if `ephemeralKey` is `false`.

~~~javascript
var bsv = require('bsv')
var IES = require('bsv/ecies')

var alice = bsv.PrivateKey()
var alicePubkey = alice.publicKey
var bob = bsv.PrivateKey()
var bobPubkey = bob.publicKey

var iesAlice = new IES({'nokey':true}).privateKey(alice).publicKey(bobPubkey)

var iesBob = new IES({'nokey':true}).privateKey(bob).publicKey(alicePubkey)

messageAlice = iesAlice.encrypt('Hello Bob')
messageAliceRecover = iesAlice.decrypt(messageAlice)
~~~

### ECDH Key

Sometimes you may want to extract ECDH key for other use.

~~~javascript
var bsv = require('bsv')
var IES = require('bsv/ecies')

var alice = bsv.PrivateKey()
var alicePubkey = alice.publicKey
var bob = bsv.PrivateKey()
var bobPubkey = bob.publicKey

var iesAlice = new IES().privateKey(alice).publicKey(bobPubkey)

var iesBob = new IES().privateKey(bob).publicKey(alicePubkey)

var sharedSecret = iesAlice.ivkEkM
var sharedSecret = iesBob.ivkEkM
~~~

### Bitcore ECIES

Sometimes you may want to use bitcore sytle ECIES.

~~~javascript
var bsv = require('bsv')
var IES = require('bsv/ecies').bitcoreECIES
~~~

