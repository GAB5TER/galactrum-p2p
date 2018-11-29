'use strict';

var spec = {
  name: 'P2P',
  message: 'Internal Error on orecore-p2p Module {0}'
};

module.exports = require('orecore-lib').errors.extend(spec);
