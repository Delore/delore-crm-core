const pretty = require('pino-pretty');

const stream = pretty({
   levelFirst: true,
   colorize: true,
   ignore: 'pid,hostname',
   translateTime: 'yyyy-mm-dd HH:MM:ss.l',
});

const pino = require('pino')(stream);

pino.level = process.env.PINO_LOG_LEVEL || 'fatal';

exports = module.exports = {

   setLevel(level) {
      pino.level = level || 'fatal';
   },

   getPino() {
      return pino;
   },

   info(message) {
      pino.info(message);
   },

   info(mensagem, fileName, methodName) {
      pino.info({ fileName, methodName }, mensagem);
   },

   debug(message) {
      pino.debug(message);
   },

   debug(mensagem, fileName, methodName) {
      pino.debug({ fileName, methodName }, mensagem);
   },

   warn(message) {
      pino.warn(message);
   },

   warn(mensagem, fileName, methodName) {
      pino.warn({ fileName, methodName }, mensagem);
   },

   error(message) {
      pino.error(message);
   },

   error(error, fileName, methodName) {
      pino.error({ error: error.stack || error.message || error, fileName, methodName });
   },

   fatal(message) {
      pino.fatal(message);
   },

   fatal(mensagem, fileName, methodName) {
      pino.fatal({ fileName, methodName }, mensagem);
   },
};
