Galactrum P2P
=======

`orecore-p2p` adds Galactrum protocol support for Orecore.

## Getting Started

In order to connect to the Galactrum network, you'll need to know the IP address of at least one node of the network, or use [Pool](/docs/pool.md) to discover peers using a DNS seed.

```javascript
var Peer = require('orecore-p2p').Peer;

var peer = new Peer({host: '127.0.0.1'});

peer.on('ready', function() {
  // peer info
  console.log(peer.version, peer.subversion, peer.bestHeight);
});
peer.on('disconnect', function() {
  console.log('connection closed');
});
peer.connect();
```

Then, you can get information from other peers by using:

```javascript
// handle events
peer.on('inv', function(message) {
  // message.inventory[]
});
peer.on('tx', function(message) {
  // message.transaction
});
```

Take a look at the [bitcore guide](http://bitcore.io/guide/peer.html) on the usage of the `Peer` class.

## Contributing

See [CONTRIBUTING.md](https://github.com/galactrum/galactrum/blob/master/CONTRIBUTING.md) on the main Galactrum repo for information about how to contribute.

## License

Code released under [the MIT license](https://github.com/GAB5TER/orecore-p2p/blob/master/LICENSE).

Copyright 2013-2015 BitPay, Inc. Bitcore is a trademark maintained by BitPay, Inc.
