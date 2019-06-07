'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var orecore = require('orecore-lib');
var $ = orecore.util.preconditions;
var _ = orecore.deps._;

/**
 * @param {Block=} arg - An instance of a Block
 * @param {Object} options
 * @param {Function} options.Block - A block constructor
 * @extends Message
 * @constructor
 */
function BlockMessage(arg, options) {
  Message.call(this, options);
  this.Block = options.Block;
  this.command = 'block';
  $.checkArgument(
    _.isUndefined(arg) || arg instanceof this.Block,
    'An instance of Block or undefined is expected'
  );
  this.block = arg;
}
inherits(BlockMessage, Message);

BlockMessage.prototype.setPayload = function(payload) {
  this.block = this.Block.fromBuffer(payload);
};

BlockMessage.prototype.getPayload = function() {
  return this.block.toBuffer();
};

module.exports = BlockMessage;
