'use strict';
const logger = require('./logger');
const memory = require('./memory');
const moment = require('moment-timezone');

moment.locale('pt');

module.exports = {
   random6() {
      return Math.floor(100000 + Math.random() * 900000);
   },

   fill(text, align, len) {
      var lenSpace = len;
      var textPrint = '' + text;
      if (textPrint.length > len) {
         textPrint = textPrint.substring(0, len);
         lenSpace = textPrint.length - len;
      } else {
         if (align === 'L') {
            lenSpace = len - textPrint.length;
         } else {
            lenSpace = len;
         }
      }
      if (align === 'R') {
         return textPrint.padStart(lenSpace);
      } else if (align === 'L') {
         return textPrint + ' '.repeat(lenSpace);
      } else {
         return textPrint + ' '.repeat(lenSpace);
      }
   },

   zeroFill(text, len) {
      return text.toString().padStart(len, '0');
   },

   spaceFillR(text, len) {
      return text.toString().padStart(len, ' ');
   },

   spaceFillL(text, len) {
      return text.toString().padEnd(len, ' ');
   },

   strMsk(value, mask) {
      if (!value) {
         return value;
      }
      value = value.toString();
      var masked = '';
      for (let i = 0; i < mask.length; i++) {
         let pos = mask.substring(i, i + 1);
         let ref = value.substring(i, i + 1);
         if (pos == '#') {
            masked = masked + ref;
         } else {
            masked = masked + pos;
            let aux = value.substr(0, i) + pos + value.substr(i, value.length);
            value = aux;
         }
      }
      return masked;
   },

   getPhoneBySessionItem(sessionItem) {
      if (sessionItem.canal == 'WhatsApp') {
         return this.formatPhone(sessionItem.sessionId);
      } else if (sessionItem.canal == 'WhatsAppBusiness') {
         return this.formatPhone(sessionItem.sessionId);
      } else if (sessionItem.canal == 'WhatsAppZAPI') {
         return this.formatPhone(sessionItem.sessionId);
      } else if (sessionItem.canal == 'Widget') {
         return sessionItem.sessionId;
      } else if (sessionItem.canal == 'Messenger') {
         return '';
      } else if (sessionItem.canal == 'Instagram') {
         return '';
      }
   },

   getSessionIdBySessionItem(sessionItem) {
      if (sessionItem.canal == 'WhatsApp') {
         return this.formatPhone(sessionItem.sessionId);
      } else if (sessionItem.canal == 'WhatsAppBusiness') {
         return this.formatPhone(sessionItem.sessionId);
      } else if (sessionItem.canal == 'WhatsAppZAPI') {
         return this.formatPhone(sessionItem.sessionId);
      } else if (sessionItem.canal == 'Widget') {
         return sessionItem.sessionId;
      } else if (sessionItem.canal == 'Messenger') {
         return sessionItem.sessionId;
      } else if (sessionItem.canal == 'Instagram') {
         return sessionItem.sessionId;
      }
   },

   getDDI(phone) {
      if (phone.startsWith('55') && phone.length == 13) {
         return '55';
      } else if (phone.startsWith('55') && phone.length == 12) {
         return '55';
      } else {
         return '';
      }
   },

   getPhone8(phone) {
      if (phone === undefined || phone == null || phone == '') {
         return phone;
      }
      // 5511973599559 - 13
      // 551134225588 - 12
      if (this.getDDI(phone) == '55') {
         var newPhone = phone;
         if (phone.length == 13) {
            newPhone = newPhone.substring(0, 4) + newPhone.substring(5, 13);
         } else if (phone.length == 12) {
            newPhone = newPhone.substring(0, 4) + '9' + newPhone.substring(4, 12);
         }
         return this.formatPhone(newPhone);
      } else {
         return this.formatPhone(phone);
      }
   },

   async formatPhoneDDI(companyId, phone) {
      if (phone === undefined || phone == null || phone == '') {
         return phone;
      }
      var phoneFormatted = this.formatPhone(phone);
      var ddi = await memory.findMemory('ddi_' + companyId);
      if (ddi) {
         if (phoneFormatted.startsWith(ddi)) {
            return phoneFormatted;
         } else {
            return ddi + phoneFormatted;
         }
      } else {
         return phoneFormatted;
      }
   },

   formatPhone(phone) {
      if (phone === undefined || phone == null || phone == '') {
         return phone;
      }
      phone = this.removeMask(phone).substring(0, 20);
      return this.removeMask(phone);
   },

   formatPhoneIOS(phone) {
      return phone;
   },

   strToLine(text, len) {
      var retLine = [];
      var spl = text.split(' ');
      var line = '';
      spl.forEach((element) => {
         var lineAux = line;
         lineAux = lineAux + element + ' ';
         if (lineAux.length <= len) {
            line = line + element + ' ';
         } else {
            retLine.push(line.substr(0, line.length - 1));
            line = '';
            line = line + element + ' ';
         }
      });
      retLine.push(line.substr(0, line.length - 1));
      return retLine;
   },

   fDate(date) {
      return moment(date).tz('America/Sao_Paulo').format('DD/MM/YYYY');
   },

   fDateDDMM(date) {
      return moment(date).tz('America/Sao_Paulo').format('DD/MM');
   },

   fDateTime(date) {
      return moment(date).tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm');
   },

   fDateTimeDB(date) {
      return moment(date).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm');
   },

   fDateFullTimeDB() {
      return moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
   },

   nowDateTimeDB() {
      return moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
   },

   nowDateTimeTZ(timezone) {
      return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
   },

   nowDateDB() {
      return moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
   },

   nowDateTime() {
      return moment().tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm');
   },

   nowTimePass() {
      return moment().tz('America/Sao_Paulo').format('HHmm');
   },

   nowTimeFormatted() {
      return moment().tz('America/Sao_Paulo').format('HH:mm');
   },

   nowDayPass() {
      return moment().tz('America/Sao_Paulo').format('DD');
   },

   fDateDB(str) {
      if (!str || str == null || str == '') {
         return null;
      } else {
         return moment(str).tz('America/Sao_Paulo').format('YYYY-MM-DD');
      }
   },

   fDateDBAdd(str, day) {
      if (!str || str == null || str == '') {
         return null;
      } else {
         return moment(str).tz('America/Sao_Paulo').add(day, 'days').format('YYYY-MM-DD');
      }
   },

   strToDate(str) {
      const date = moment(str, 'YYYY-MM-DD').toDate();
      return moment(date).tz('America/Sao_Paulo').format('DD/MM/YYYY');
   },

   nowFull() {
      var d = moment().tz('America/Sao_Paulo').format('DD');
      var m = moment().tz('America/Sao_Paulo').format('MMMM');
      var y = moment().tz('America/Sao_Paulo').format('YYYY');

      return '' + d + ' de ' + m + ' de ' + y;
   },

   strToFullDate(str) {
      const date = moment(str, 'YYYY-MM-DD').toDate();
      var d = moment(date).format('DD');
      var m = moment(date).format('MMMM');
      var y = moment(date).format('YYYY');

      return '' + d + ' de ' + m + ' de ' + y;
   },

   now() {
      return moment().tz('America/Sao_Paulo').format('DD/MM/YYYY');
   },

   nowDB() {
      return moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
   },

   subtractDay(day, format) {
      return moment().tz('America/Sao_Paulo').subtract(day, 'days').format(format);
   },

   addDays(date, days) {
      return moment(date).tz('America/Sao_Paulo').add(days, 'days').format('YYYY-MM-DD');
   },

   strToDateDB(str) {
      const date = moment(str, 'DD/MM/YYYY').toDate();
      return moment(date).tz('America/Sao_Paulo').format('YYYY-MM-DD');
   },

   firstDayMonthDB() {
      return moment().tz('America/Sao_Paulo').startOf('month').format('YYYY-MM-DD');
   },

   lastDayMonthDB() {
      return moment().tz('America/Sao_Paulo').endOf('month').format('YYYY-MM-DD');
   },

   firstDayOfWeekOfLastWeekDB() {
      return moment().tz('America/Sao_Paulo').subtract(7, 'days').startOf('week').format('YYYY-MM-DD');
   },

   lastDayOdWeekOfLastWeekDB() {
      return moment().tz('America/Sao_Paulo').subtract(7, 'days').endOf('week').format('YYYY-MM-DD');
   },

   nowDayOfWeek() {
      var day = moment().tz('America/Sao_Paulo').isoWeekday();
      if (day == 1) return 'seg';
      if (day == 2) return 'ter';
      if (day == 3) return 'qua';
      if (day == 4) return 'qui';
      if (day == 5) return 'sex';
      if (day == 6) return 'sab';
      if (day == 7) return 'dom';
      return '';
   },

   nowRangeHour(horI, horF) {
      var now = moment().tz('America/Sao_Paulo');
      var hI = moment(horI, 'HH:mm').tz('America/Sao_Paulo');
      var hF = moment(horF, 'HH:mm').tz('America/Sao_Paulo');
      if (hF.isBefore(hI)) {
         return now.isAfter(hI) || now.isBefore(hF);
      } else {
         return now.isAfter(hI) && now.isBefore(hF);
      }
   },

   cToV(valueStr) {
      if (valueStr == null || valueStr == undefined || valueStr == '') {
         return 0;
      }
      if (typeof valueStr === 'string') {
         valueStr = valueStr.replace(',', '.');
         return parseFloat(valueStr);
      } else {
         return valueStr;
      }
   },

   cToF(valueStr) {
      if (valueStr == null || valueStr == undefined || valueStr == '') {
         return 0;
      }
      if (typeof valueStr === 'string') {
         valueStr = valueStr.replace('.', '').replace(',', '.');
         return parseFloat(valueStr);
      } else {
         return valueStr;
      }
   },

   isNumber(valueStr) {
      try {
         if (valueStr == '' || valueStr == null || valueStr == undefined) {
            return false;
         }
         if (typeof valueStr === 'number') {
            return true;
         }
         return !isNaN(this.cToV(valueStr));
      } catch (error) {
         return false;
      }
   },

   isNumberType(val) {
      return typeof val === 'number';
   },

   strToCur(valueStr) {
      if (valueStr == null || valueStr == undefined || valueStr == '') {
         return '0';
      }
      return valueStr.replace('.', ',');
   },

   strToN(value, decimal) {
      var v = this.cToV(value);
      value = v.toFixed(decimal);

      if (!value.includes('.')) value = value + '.' + '0'.repeat(decimal);
      let dec = 10;
      if (decimal == 0) dec = 1;
      if (decimal == 1) dec = 10;
      if (decimal == 2) dec = 100;
      if (decimal == 3) dec = 1000;
      if (decimal == 4) dec = 10000;
      if (decimal == 5) dec = 100000;
      if (decimal == 6) dec = 1000000;
      if (decimal == 7) dec = 10000000;
      if (decimal == 8) dec = 100000000;
      if (decimal == 9) dec = 1000000000;
      if (decimal == 10) dec = 10000000000;
      var v = value.replace(/\D/g, '');
      v = (parseFloat(v) / dec).toFixed(decimal) + '';
      v = v.replace('.', ',');
      v = v.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
      v = v.replace(/(\d)(\d{3}),/g, '$1.$2,');
      return v;
   },

   appendString(value, string) {
      if (value) {
         return value + '\n' + string;
      } else {
         return string;
      }
   },

   getModFrete(cod) {
      if (cod === 0) return '0-Remetente(CIF)';
      if (cod === 1) return '1-Destinatário(FOB)';
      if (cod === 2) return '2-Terceiros';
      if (cod === 3) return '3-Remetente';
      if (cod === 4) return '4-Destinatário';
      if (cod === 9) return '9-Sem Ocorrência';
   },

   round(num, dec) {
      if (num < 0) return -this.round(-num, dec);
      var p = Math.pow(10, dec);
      var n = num * p;
      var f = n - Math.floor(n);
      var e = Number.EPSILON * n;
      return f >= 0.5 - e ? Math.ceil(n) / p : Math.floor(n) / p;
   },

   onlyNumber(str) {
      try {
         var numStr = str.replace(/[^0-9]/g, '');
         var ret = parseInt(numStr);
         if (isNaN(ret)) {
            return 0;
         } else {
            return ret;
         }
      } catch (error) {
         return 0;
      }
   },

   // Remove all Mask
   removeMask(value) {
      value = '' + value;
      if (value) {
         return value
            .replace('(', '')
            .replace(')', '')
            .replace(/'/g, '')
            .replace(/\[/g, '')
            .replace(/\]/g, '')
            .replace('+', '')
            .replace('-', '')
            .replace('-', '')
            .replace('-', '')
            .replace('.', '')
            .replace('.', '')
            .replace('.', '')
            .replace('/', '')
            .replace('+', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '');
      } else {
         return value;
      }
   },

   handleMsgSend(value) {
      if (value) {
         var pattern = /\*\*([^\*]*)+\*\*/gim;
         var result = value.match(pattern);
         if (result) {
            for (var i = 0; i < result.length; i++) {
               var value = value.replace(result[i], result[i].replace(/\*\*/g, '*'));
            }
         }
         return value;
      } else {
         return value;
      }
   },

   removeMaskURL(value) {
      if (value) {
         return value
            .replace('https://', '')
            .replace('http://)', '')
            .replace(/./g, '')
            .replace(/./g, '')
            .replace(/./g, '')
            .replace(/./g, '')
            .replace('.', '')
            .replace('.', '')
            .replace('/', '')
            .replace('+', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '')
            .replace(' ', '');
      } else {
         return value;
      }
   },

   fValPrint(value, decimal, length) {
      return this.fill(this.strToN(value.toString(), decimal), 'R', length);
   },

   removeAcento(value) {
      if (value) {
         return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      } else {
         return value;
      }
   },

   commentMsk(value) {
      return value + ';' + 'msk';
   },

   commentDate(value) {
      return value + ';' + 'date';
   },

   commentText(value) {
      return value + ';' + 'text';
   },

   commentArea(value) {
      return value + ';' + 'area';
   },

   commentNumber(value) {
      return value + ';' + 'number';
   },

   commentSelect(value) {
      return value + ';' + 'select';
   },

   commentMultSelect(value) {
      return value + ';' + 'multSelect';
   },

   commentSearch(value) {
      return value + ';' + 'search';
   },

   commentRadio(value) {
      return value + ';' + 'radio';
   },

   commentCheck(value) {
      return value + ';' + 'check';
   },

   sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
   },

   isValidCPF(cpf) {
      cpf = cpf.replace(/[^\d]+/g, '');
      if (cpf == '') return false;
      // Elimina CPFs inválidos conhecidos
      if (
         cpf.length != 11 ||
         cpf == '00000000000' ||
         cpf == '11111111111' ||
         cpf == '22222222222' ||
         cpf == '33333333333' ||
         cpf == '44444444444' ||
         cpf == '55555555555' ||
         cpf == '66666666666' ||
         cpf == '77777777777' ||
         cpf == '88888888888' ||
         cpf == '99999999999'
      )
         return false;
      // Valida 1o digito
      var add = 0;
      for (var i = 0; i < 9; i++) {
         add += parseInt(cpf.charAt(i)) * (10 - i);
      }
      var rev = 11 - (add % 11);
      if (rev == 10 || rev == 11) {
         rev = 0;
      }
      if (rev != parseInt(cpf.charAt(9))) {
         return false;
      }
      // Valida 2o digito
      add = 0;
      for (var i = 0; i < 10; i++) {
         add += parseInt(cpf.charAt(i)) * (11 - i);
      }
      rev = 11 - (add % 11);
      if (rev == 10 || rev == 11) {
         rev = 0;
      }
      if (rev != parseInt(cpf.charAt(10))) {
         return false;
      }
      return true;
   },

   sendTeleNotify(msg) {
      if (process.env.TELEGRAM_BOT_ENV_NOTIFY === 'dev') {
         logger.warn('sendTeleNotify: ' + msg);
         return;
      }
      try {
         const axios = require('axios');
         const url = 'https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN_NOTIFY + '/sendMessage?chat_id=955186557&text=' + msg;
         let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: encodeURI(url),
            headers: {},
         };
         axios
            .request(config)
            .then(async function (response) {
               logger.debug('sendTeleNotify: ' + response.data);
            })
            .catch((error) => {
               logger.error('sendTeleNotify: ' + error);
            });
      } catch (error) {
         logger.error('sendTeleNotify: ' + error);
      }
   },

   isDateValid(date) {
      var reg = /(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d/;
      if (date.match(reg)) {
         return true;
      } else {
         return false;
      }
   },

   extractTel(tel) {
      if (!tel) return '';
      tel = tel.replace(' ', '');
      tel = tel.replace(' ', '');
      tel = tel.replace(' ', '');
      tel = tel.replace('  ', '');
      tel = tel.replace('   ', '');
      tel = tel.replace(/\./g, '');
      tel = tel.replace(/-/g, '');
      tel = tel.replace(/\(/g, '');
      tel = tel.replace(/\)\s+/g, '');
      tel = tel.replace(/\)/g, '');

      var reg1 = /\d\d\d\d\d\d\d\d\d\d\d/;
      var reg2 = /\d\d\d\s+\d\d\d\d\d\d\d\d/;
      var reg3 = /\d\d\d\d\d\s+\d\d\d\d\d\d\d\d/;

      var reg20 = /^\d\d\d\d\d\d\d\d\d/;

      var find = tel.match(reg1);
      if (find == null) {
         var find = tel.match(reg2);
         if (find == null) {
            var find = tel.match(reg3);
            if (find == null) {
               find = tel.match(reg20);
               if (find == null) {
                  return '';
               } else {
                  return find[0];
               }
            } else {
               return find[0];
            }
         } else {
            return find[0];
         }
      } else {
         return find[0];
      }
   },

   cloneOBJ(obj) {
      var clone = {};
      for (var i in obj) {
         if (typeof obj[i] == 'object' && obj[i] != null) clone[i] = this.cloneOBJ(obj[i]);
         else clone[i] = obj[i];
      }
      return clone;
   },

   parse(text, len) {
      var result = [];
      if (len > text.length) {
         result.push(text);
         return result;
      }
      while (text.length > 0) {
         var part = text.substring(0, len);
         var rest = text.substring(len, text.length);
         result.push(part);
         text = rest;
      }
      return result;
   },

   fDateRef(value) {
      var moment = require('moment');
      const date = moment(value, 'YYYY-MM-DD');
      var month = date.format('MM');
      var year = date.format('YYYY');
      return month + '/' + year;
   },

   generateId() {
      return Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
   },

   generateIdSign() {
      return Math.floor(10000 + Math.random() * 90000);
   },

   updateSecurity(model, listAtt) {
      var copyModel = JSON.parse(JSON.stringify(model));

      for (let index = 0; index < listAtt.length; index++) {
         const element = listAtt[index];
         delete copyModel[element];
      }
      return copyModel;
   },

   wait(milliseconds) {
      return new Promise((resolve) => {
         setTimeout(resolve, milliseconds);
      });
   },

   convertToJSONSchema(name, description, parameters) {
      const schema = {
         name: name,
         description: description || '',
         parameters: {
            type: 'object',
            properties: {},
            required: [],
         },
      };
      parameters.forEach((param) => {
         const key = param.key;
         const valueType = param.value.includes('{{') ? 'string' : typeof param.value;
         schema.parameters.properties[key] = {
            type: valueType,
            description: param.description || '',
         };
         if (param.required) {
            schema.parameters.required.push(key);
         }
      });
      return schema;
   },

   // Função para verificar se o código contém comandos perigosos
   isCodeSafe(code) {
      const blacklist = [
         /process\s*\.\s*env/, // Bloqueia acesso a process.env
         /process\s*\.\s*mainModule/, // Bloqueia acesso ao mainModule
         /require\s*\(/, // Bloqueia require()
         /fs\s*\./, // Bloqueia uso do módulo fs
         /child_process/, // Bloqueia child_process (exec, spawn, fork, etc.)
         /globalThis/, // Impede acesso a globalThis
         /global/, // Impede acesso a global
         /Function\s*\(/, // Bloqueia Function()
         /eval\s*\(/, // Bloqueia eval()
         /setTimeout\s*\(/, // Bloqueia setTimeout()
         /setInterval\s*\(/, // Bloqueia setInterval()
         /__proto__/, // Bloqueia manipulação de __proto__
         /constructor\s*\./, // Bloqueia acesso ao construtor
         /Object\s*\.\s*prototype/, // Bloqueia acesso ao prototype
         /exec\s*\(/, // Bloqueia exec()
         /spawn\s*\(/, // Bloqueia spawn()
         /fork\s*\(/, // Bloqueia fork()
         /vm\s*\./, // Bloqueia acesso ao módulo vm
         /net\s*\./, // Bloqueia acesso ao módulo net
         /http\s*\./, // Bloqueia acesso ao módulo http
         /crypto\s*\./, // Bloqueia acesso ao módulo crypto
      ];
      return !blacklist.some((regex) => regex.test(code));
   },

   getTypeMsgWhatsAppForText(row) {
      if (row.tmsg === 'text') {
         return row.msg.substring(0, 60);
      } else if (row.tmsg === 'image') {
         return 'Nova imagem';
      } else if (row.tmsg === 'audio') {
         return 'Novo áudio';
      } else if (row.tmsg === 'video') {
         return 'Novo vídeo';
      } else if (row.tmsg === 'document') {
         return 'Novo documento';
      } else {
         return 'Nova mensagem';
      }
   },

   generateSecretKey(companyId) {
      const crypto = require('crypto');
      var key = companyId + '_' + crypto.randomBytes(8).toString('hex');
      return key.substring(0, 20);
   },

   getUrlFromReq(baseUrl) {
      var urlReq = '';
      if (baseUrl.indexOf('/s/') > -1) {
         urlReq = baseUrl.substring(0, baseUrl.indexOf('/s/') + 3);
      } else {
         var partes = baseUrl.split('/s');
         for (let index = 0; index < partes.length - 1; index++) {
            const element = partes[index];
            urlReq = urlReq + '' + element + '/s';
         }
      }
      return urlReq;
   }
}