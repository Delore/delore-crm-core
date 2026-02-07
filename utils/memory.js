const logger = require('./logger.js');

const memory = {};

module.exports = {
   async addMemory(key, value) {
      if (value == null || value == undefined) {
         return;
      }
      try {
         memory[key] = value;
         logger.info('Memory added: ' + key);
      } catch (error) {
         logger.error('Memory - Error addMemory: ' + error.message);
      }
   },

   async findMemory(key) {
      if (key == null || key == undefined || key == '') {
         return null;
      }
      try {
         return memory[key] || null;
      } catch (error) {
         logger.error('Memory - Error findMemory: ' + error.message);
         return null;
      }
   },

   async delMemory(key) {
      if (key == null || key == undefined || key == '') {
         return;
      }
      try {
         delete memory[key];
      } catch (error) {
         logger.error('Memory - Error delMemory: ' + error.message);
      }
   },
};
