'use strict';

const access = require('./access');
const util = require('./util');

module.exports = Object.assign({}, access, { util });
