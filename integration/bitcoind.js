'use strict';

var chai = require('chai');

/* jshint unused: false */
var should = chai.should();
var sinon = require('sinon');

var orecore = require('orecore-lib');
var _ = orecore.deps._;
var Random = orecore.crypto.Random;
var BN = orecore.crypto.BN;
var BufferUtil = orecore.util.buffer;
var p2p = require('../');
var Peer = p2p.Peer;
var Pool = p2p.Pool;
var Networks = orecore.Networks;
var Messages = p2p.Messages;
var Inventory = p2p.Inventory;
var Block = orecore.Block;
var Transaction = orecore.Transaction;

// config
var network = process.env.NETWORK === 'testnet' ? Networks.testnet : Networks.livenet;
var messages = new Messages({
  network: network
});
var blockHash = {
  'livenet': '00000000003ef7b9adb4162d20427238375abbe313d65df4187667115454d822',
  'testnet': '000001d3e796011e031d82e4196ffe748460d2cc5be10432cfa1258e37bf82ac'
};
var stopBlock = {
  'livenet': '0000000000211d8948271e856637829059b2f6f569efe73c64dde0ce85dca985',
  'testnet': '00000174d18b1123125d8fc55b42516ff9ea6b1b86d1065b5069e1a4858a8e31'
};
var txHash = {
  'livenet': 'a5bf363461906769ce5c5c5a48994ae80b8af439dff4c7a579d482c2de5ee265',
  'testnet': '44949f8c999f59f7dfc999ac3916579a3b58b2740d6142efd2bacefd9fceda2d'
};

// These tests require a running galactrumd instance
describe('Integration with ' + network.name + ' galactrumd', function() {

  this.timeout(15000);
  var opts = {
    host: 'localhost',
    network: network.name
  };
  it('handshakes', function(cb) {
    var peer = new Peer(opts);
    peer.once('version', function(m) {
      m.version.should.be.above(70200);
      m.services.toString().should.equal('5');
      Math.abs(new Date() - m.timestamp).should.be.below(10000); // less than 10 seconds of time difference
      m.nonce.length.should.equal(8);
      m.startHeight.should.be.above(240000);
      cb();
    });
    peer.once('verack', function(m) {
      should.exist(m);
      m.command.should.equal('verack');
    });
    peer.connect();
  });
  var connect = function(cb) {
    var peer = new Peer(opts);
    peer.once('ready', function() {
      cb(peer);
    });
    peer.once('error', function(err) {
      should.not.exist(err);
    });
    peer.connect();
  };
  it('connects', function(cb) {
    connect(function(peer) {
      peer.version.should.be.above(70200);
      _.isString(peer.subversion).should.equal(true);
      _.isNumber(peer.bestHeight).should.equal(true);
      cb();
    });
  });
  it('handles inv', function(cb) {
    // assumes there will be at least one transaction/block
    // in the next few seconds
    connect(function(peer) {
      peer.once('inv', function(message) {
        message.inventory[0].hash.length.should.equal(32);
        cb();
      });
    });
  });
  it('handles addr', function(cb) {
    connect(function(peer) {
      peer.once('addr', function(message) {
        message.addresses.forEach(function(address) {
          (address.time instanceof Date).should.equal(true);
          should.exist(address.ip);
          (address.services instanceof BN).should.equal(true);
        });
        cb();
      });
      var message = messages.GetAddr();
      peer.sendMessage(message);
    });
  });
  it('requests inv detailed info', function(cb) {
    connect(function(peer) {
      peer.once('block', function(message) {
        should.exist(message.block);
        cb();
      });
      peer.once('tx', function(message) {
        should.exist(message.transaction);
        cb();
      });
      peer.once('inv', function(message) {
        var get = messages.GetData(message.inventory);
        peer.sendMessage(get);
      });
    });
  });
  it('sends tx inv and receives getdata for that tx', function(cb) {
    connect(function(peer) {
      var type = Inventory.TYPE.TX;
      var inv = [{
        type: type,
        hash: new Buffer(Random.getRandomBuffer(32)) // needs to be random for repeatability
      }];
      peer.once('getdata', function(message) {
        message.inventory[0].should.deep.equal(inv[0]);
        cb();
      });
      var message = messages.Inventory(inv);
      message.inventory[0].hash.length.should.equal(32);
      peer.sendMessage(message);
    });
  });
  it('requests block data', function(cb) {
    connect(function(peer) {
      peer.once('block', function(message) {
        (message.block instanceof Block).should.equal(true);
        cb();
      });
      var message = messages.GetData.forBlock(blockHash[network.name]);
      peer.sendMessage(message);
    });
  });
  var fakeHash = 'e2dfb8afe1575bfacae1a0b4afc49af7ddda69285857267bae0e22be15f74a3a';
  it('handles request tx data not found', function(cb) {
    connect(function(peer) {
      var expected = messages.NotFound.forTransaction(fakeHash);
      peer.once('notfound', function(message) {
        message.command.should.equal('notfound');
        message.inventory[0].type.should.equal(Inventory.TYPE.TX);
        var expectedHash = expected.inventory[0].hash.toString('hex');
        message.inventory[0].hash.toString('hex').should.equal(expectedHash);
        cb();
      });
      var message = messages.GetData.forTransaction(fakeHash);
      peer.sendMessage(message);
    });
  });
  var from = [blockHash[network.name]];
  var stop = stopBlock[network.name];
  it('gets headers', function(cb) {
    connect(function(peer) {
      peer.once('headers', function(message) {
        message.command.should.equal('headers');
        message.headers.length.should.equal(4);
        cb();
      });
      var message = messages.GetHeaders({
        starts: from,
        stop: stop
      });
      peer.sendMessage(message);
    });
  });
  it('gets blocks', function(cb) {
    connect(function(peer) {
      peer.once('inv', function(message) {
        message.command.should.equal('inv');
        if (message.inventory.length === 2) {
          message.inventory[0].type.should.equal(Inventory.TYPE.BLOCK);
          message.inventory[1].type.should.equal(Inventory.TYPE.BLOCK);
          cb();
        }
      });
      var message = messages.GetBlocks({
        starts: from,
        stop: stop
      });
      peer.sendMessage(message);
    });
  });
  var testInvGetData = function(expected, message, cb) {
    connect(function(peer) {
      peer.once('getdata', function(message) {
        message.command.should.equal('getdata');
        message.inventory[0].type.should.equal(expected.inventory[0].type);
        var expectedHash = expected.inventory[0].hash.toString('hex');
        message.inventory[0].hash.toString('hex').should.equal(expectedHash);
        cb();
      });
      peer.sendMessage(message);
    });
  };
  it('sends block inv and receives getdata', function(cb) {
    var randomHash = new Buffer(Random.getRandomBuffer(32)); // slow buffer
    var expected = messages.GetData.forBlock(randomHash);
    var message = messages.Inventory.forBlock(randomHash);
    testInvGetData(expected, message, cb);
  });
  it('sends tx inv and receives getdata', function(cb) {
    var randomHash = new Buffer(Random.getRandomBuffer(32)); // slow buffer
    var expected = messages.GetData.forTransaction(randomHash);
    var message = messages.Inventory.forTransaction(randomHash);
    testInvGetData(expected, message, cb);
  });
});
