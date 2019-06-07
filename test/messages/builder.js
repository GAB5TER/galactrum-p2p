'use strict';

var should = require('chai').should();
var P2P = require('../../');
var builder = P2P.Messages.builder;
var orecore = require('orecore-lib');

describe('Messages Builder', function() {

  describe('@constructor', function() {

    it('should return commands based on default', function() {
      // instantiate
      var b = builder();
      should.exist(b);
    });

    it('should return commands with customizations', function() {
      // instantiate
      var b = builder({
        network: orecore.Networks.testnet,
        Block: orecore.Block,
        Transaction: orecore.Transaction
      });
      should.exist(b);
    });

  });

});
