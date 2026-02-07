const Sequelize = require('sequelize');
const logger = require('../utils/logger.js');
const authControl = require('../auth/auth.control.js');
let sequelize = null;

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
var db = null;

async function connectMongoDB() {
   try {
      await client.connect();
      db = client.db('sessions');
      logger.info('mongoDB - - > Conectado ao MongoDB!');
      if (db) {
         await authControl.loadAllSecretToMemory(db);
      }
   } catch (error) {
      logger.error('mongoDB - - > Erro ao conectar:', error.message);
   }
}

module.exports = {
   getMongoDB: function () {
      return db;
   },
   getSequelize: function () {
      return sequelize;
   },
   init(onConnect) {
      sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
         dialect: 'mysql',
         host: process.env.DB_HOST,
         pool: {
            max: 400, // Aumentar o limite máximo de conexões se o tráfego for alto
            min: 20, // Manter um número mínimo de conexões ativas
            idle: 10000, // Tempo que uma conexão pode ficar ociosa (30 segundos)
            acquire: 60000, // Tempo máximo para aguardar uma conexão do pool (60 segundos)
            evict: 30000, // Remover conexões ociosas após 30 segundos
         },
         timezone: '-03:00',
         dialectOptions: {
            multipleStatements: true,
         },
         define: {
            underscored: false,
            freezeTableName: true,
            charset: 'utf8',
            timestamps: false,
            createdAt: false,
            updatedAt: false,
            hooks: {
               beforeValidate: async (model, options) => {
                  var models = sequelize.models;
                  var modelOriginal = models[model.constructor.name];
                  for (const key in options.fields) {
                     const field = options.fields[key];
                     if (modelOriginal && modelOriginal.fieldRawAttributesMap[field] && modelOriginal.fieldRawAttributesMap[field].type.constructor.key == 'DATEONLY') {
                        if (model[field] === '') {
                           model[field] = null;
                        }
                     }
                     if (modelOriginal && modelOriginal.fieldRawAttributesMap[field] && modelOriginal.fieldRawAttributesMap[field].type.constructor.key == 'DATE') {
                        if (model[field] === '') {
                           model[field] = null;
                        }
                     }
                  }
               },
            },
         },
         isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
         logging: (sql) => logger.info(sql),
      });

      sequelize
         .authenticate()
         .then(async () => {
            //
            // Após conectar ao MySQL, conecta ao MongoDB
            //
            await connectMongoDB();

            logger.info('MySQL and MongoDB - - > Connection has been established successfully.');
            onConnect();
         })
         .catch((err) => {
            logger.error('MySQL and MongoDB - - > Unable to connect to the database:' + err.message);
         });
   },
};
