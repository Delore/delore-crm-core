'use strict';

const access = require('./utils/access');
const util = require('./utils/util');
const logger = require('./utils/logger');
const memory = require('./utils/memory');
const print = require('./print');
const authControl = require('./auth/auth.control');
const ret = require('./auth/ret');
const validRequest = require('./auth/valid.request');
const syncAccess = require('./sync/sync.access');
const sequelizeDB = require('./db/sequelize_db');
const models = require('./db/models');

const exported = Object.assign({}, {
    access,
    util,
    logger,
    memory,
    print,
    authControl,
    ret,
    validRequest,
    syncAccess,
    sequelizeDB,
    models,
});

module.exports = exported;
