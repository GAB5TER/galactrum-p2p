'use strict';

var spec = {
  name: 'P2P',
  message: 'Internal Error on galactrum-p2p Module {0}'
};

module.exports = require('galactrum-lib').errors.extend(spec);
