const logger = require('../utils/logger');
const memory = require('../utils/memory');

exports.addSecret = async function (companyId, userId, lat, lng, ip) {
    const SequelizeJS = require('../db/sequelize_db.js');
    try {
        var secret = 'secret_crm_v1_' + companyId + '_' + userId;
        var id = parseInt(companyId) + '_' + parseInt(userId);
        var updateFields = { companyId: companyId, userId: userId, secret: secret, lat: parseFloat(lat), lng: parseFloat(lng), ip: ip, last: new Date() };
        await SequelizeJS.getMongoDB().collection('authControl').updateOne(
            { id: id },
            { $set: updateFields },
            { upsert: true }
        );
        memory.addMemory('authControl_' + id, secret);
        return secret + "-" + process.env.SECRET_LOGIN_USER;
    } catch (error) {
        logger.error('Error addSecret: ' + error);
        return '';
    }
};

exports.loadAllSecretToMemory = async function (db) {
    try {
        var result = await db.collection('authControl').find({}).toArray();
        if (result) {
            logger.info('loadAllSecretToMemory: ' + result.length + ' secrets loaded');
            for (var i = 0; i < result.length; i++) {
                memory.addMemory('authControl_' + result[i].id, result[i].secret);
            }
        }
    } catch (error) {
        logger.error('Error loadAllSecretToMemory: ' + error.message);
    }
};

exports.removeSecret = async function (companyId, userId) {
    const SequelizeJS = require('../db/sequelize_db.js');
    try {
        var id = parseInt(companyId) + '_' + parseInt(userId);
        await SequelizeJS.getMongoDB().collection('authControl').deleteOne({ id: id });
        memory.delMemory('authControl_' + id);
        return true;
    } catch (error) {
        logger.error('Error removeSecret: ' + error);
        return false;
    }
};

exports.getSecret = async function (companyId, userId, lat, lng, ip) {
    const SequelizeJS = require('../db/sequelize_db.js');
    try {
        var id = parseInt(companyId) + '_' + parseInt(userId);

        var secreteInMemory = await memory.findMemory('authControl_' + id);
        if (secreteInMemory) {
            return secreteInMemory + "-" + process.env.SECRET_LOGIN_USER;
        }
        var resultGet = await SequelizeJS.getMongoDB().collection('authControl').findOne({ id: id });
        if (resultGet) {
            memory.addMemory('authControl_' + id, resultGet);
            return resultGet.secret + "-" + process.env.SECRET_LOGIN_USER;
        }
        return '';
    } catch (error) {
        logger.error('Error getSecret: ' + error);
        return '';
    }
};
