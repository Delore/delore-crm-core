'use strict';
const PDFDocument = require('pdfkit');
const util = require('../utils/util');
const getStream = require('get-stream');
const xlsx = require('xlsx');

var listDataMemory = [];

class Print {
   columns = [];
   columnsFilter = [];
   columnsTot = [];
   columnGroup = '';
   totRecords = {};
   page = 1;
   cnt = 1;
   lineGap = 0;
   adjustLinePosY = 0;
   fontSizeForce = 0;
   cntHeader = 0;
   cntFooter = 1;
   fontSize = 12;
   cntRecordTotal = 0;
   modeLandscape = false;
   callbackGetData = null;
   doc = null;
   req = null;
   res = null;
   basicReport = null;

   setGetDataCallback(callback) {
      this.callbackGetData = callback;
   }

   cleanColumns() {
      this.columns = [];
   }

   addColumDate(title, field) {
      this.columns.push({ title: title, field: field, align: 'L', len: 10, type: 'D' });
   }

   addColumDateTime(title, field) {
      this.columns.push({ title: title, field: field, align: 'L', len: 16, type: 'DT' });
   }

   addColumns(title, field, align, len) {
      this.columns.push({ title: title, field: field, align: align, len: len, type: 'S' });
   }

   addColumVal(title, field, align, len, decimal) {
      this.columns.push({ title: title, field: field, align: align, len: len, type: 'V', decimal: decimal });
   }

   setColumnsTotal(columns) {
      this.columnsTot = columns.split(';');
   }

   setGroup(column) {
      this.columnGroup = column;
   }

   clean() {
      this.columns = [];
      this.columnsFilter = [];
      this.columnsTot = [];
      this.totRecords = {};
      this.columnGroup = '';
      this.page = 1;
      this.cnt = 1;
      this.lineGap = 0;
      this.adjustLinePosY = 0;
      this.cntHeader = 0;
      this.cntFooter = 1;
      this.fontSize = 12;
      this.fontSizeForce = 0;
      this.cntRecordTotal = 0;
      this.modeLandscape = false;
      this.callbackGetData = null;
      this.doc = null;
      this.req = null;
      this.res = null;
   }

   setLineGap(value) {
      this.lineGap = value;
   }

   setAdjustLinePosY(value) {
      this.adjustLinePosY = value;
   }

   setForceFont(value) {
      this.fontSizeForce = value;
   }

   async printLinCallback(data, callBack) {
      this.doc = this.makeDoc(false);
      this.doc = this.calculateLin(this.doc, data);

      let lines = data.split('\n');
      var odd = true;
      let height = this.doc.heightOfString('M') + this.adjustLinePosY;

      for (let index = 0; index < lines.length; index++) {
         const element = lines[index];
         if (odd) {
            odd = false;
            this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('#EBEDEF');
            this.doc.stroke();
         } else {
            odd = true;
            this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('white');
         }
         this.doc
            .fillColor('black')
            .fontSize(this.fontSize)
            .lineGap(this.lineGap)
            .text(element, this.doc.x, this.doc.y + this.adjustLinePosY);
      }

      this.doc.end();

      getStream.buffer(this.doc).then((ret) => {
         callBack(ret.toString('base64'));
      });
   }

   async printLin(data, req, res) {
      this.req = req;
      this.res = res;

      this.doc = this.makeDoc(false);
      this.doc = this.calculateLin(this.doc, data);
      this.doc.pipe(res);

      this.makeHeaderLin(this.doc, this.req);

      let lines = data.split('\n');
      var odd = true;
      let height = this.doc.heightOfString('M') + this.adjustLinePosY;

      for (let index = 0; index < lines.length; index++) {
         const element = lines[index];

         if (odd) {
            odd = false;
            this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('#EBEDEF');
            this.doc.stroke();
         } else {
            odd = true;
            this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('white');
         }

         this.doc
            .fillColor('black')
            .fontSize(this.fontSize)
            .lineGap(this.lineGap)
            .text(element, this.doc.x, this.doc.y + this.adjustLinePosY);
      }

      this.finalize();
      return true;
   }

   async printList(data, req, res) {
      this.req = req;
      this.res = res;

      this.doc = this.makeDoc(false);
      this.doc = this.calculate(this.doc);
      this.doc.pipe(res);
      return this.printListEx(data);
   }

   async printListOnData(data) {
      this.doc.addPage();
      this.page++;
      this.printListEx(data);
      return true;
   }

   async printListEx(data) {
      var groupValueOld = '';

      this.makeHeader(this.doc, this.req);

      if (this.columnsTot.length > 0) {
         this.cntFooter = this.cntFooter + 1;
      }

      this.cntRecordDetails = this.cntRecordTotal - this.cntHeader - this.cntFooter - 2; // 2 do header e footer;

      if (this.columnGroup !== '') {
         if (this.columnsTot.length > 0) {
            this.cntRecordDetails = this.cntRecordDetails - 2; // 2 do group e total group
         } else {
            this.cntRecordDetails = this.cntRecordDetails - 1; // 1 do group
         }
      }

      // Records
      var odd = true;
      this.doc.fontSize(this.fontSize).lineGap(this.lineGap);
      let height = this.doc.heightOfString('M') + this.adjustLinePosY;

      for (let index = 0; index < data.length; index++) {
         const record = data[index];

         this.doc.fontSize(this.fontSize).lineGap(this.lineGap);
         let height = this.doc.heightOfString('M') + this.adjustLinePosY;

         if (this.columnGroup !== '') {
            var groupValue = record[this.columnGroup];
            if (groupValue != groupValueOld) {
               this.cntRecordDetails = this.cntRecordDetails - 1;
               groupValueOld = groupValue;
               var line = this.makeLineRecord(this.columnGroup, record[this.columnGroup], true);
               this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('#c1f4e5');
               this.doc.stroke();
               this.doc
                  .fillColor('black')
                  .fontSize(this.fontSize)
                  .lineGap(this.lineGap)
                  .text(line, this.doc.x, this.doc.y + this.adjustLinePosY);
            }
         }

         let lineRecord = '';
         for (const key in this.columns) {
            let colName = this.columns[key].field;
            var count = (colName.match(/\./g) || []).length;
            let line = '';
            if (count == 1) {
               var table = colName.split('.')[0];
               var field = colName.split('.')[1];
               line = this.makeLineRecord(this.columns[key], record[table] ? this.handleData(record[table][field]) || '' : '', true);
            } else if (count == 2) {
               var table1 = colName.split('.')[1];
               var table2 = colName.split('.')[2];
               var field = colName.split('.')[3];
               line = this.makeLineRecord(this.columns[key], this.handleData(this.getData(record, table1, table2, field)), true);
            } else {
               line = this.makeLineRecord(this.columns[key], record[this.columns[key].field] ? this.handleData(record[this.columns[key].field]) || '' : '', true);
            }
            lineRecord = lineRecord + line + ' ';
         }
         if (odd) {
            odd = false;
            this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('#EBEDEF');
            this.doc.stroke();
         } else {
            odd = true;
            this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('white');
         }

         this.doc
            .fillColor('black')
            .fontSize(this.fontSize)
            .lineGap(this.lineGap)
            .text(lineRecord, this.doc.x, this.doc.y + this.adjustLinePosY);
         this.makeLine(this.doc);
         //
         // Total Group
         //
         if (this.columnGroup !== '' && this.columnsTot.length > 0) {
            var groupValueNext = data[index + 1] ? data[index + 1][this.columnGroup] : '';
            if (groupValueNext && groupValueNext != groupValueOld) {
               this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('#ffffb4');
               this.doc.stroke();

               var lineRecordSubTot = '';
               for (const key in this.columns) {
                  let colName = this.columns[key].field;
                  let colDecimal = this.columns[key].decimal;
                  var colTot = this.columnsTot.filter(function (col) {
                     return col == colName;
                  })[0];

                  var val = '';
                  if (colTot != null) {
                     val = this.getTotField(data, groupValueOld, this.columnGroup, colTot, colDecimal);
                  }

                  let line = '';
                  line = this.makeLineRecord(this.columns[key], val, false);
                  lineRecordSubTot = lineRecordSubTot + line + ' ';
               }
               this.doc
                  .fillColor('black')
                  .fontSize(this.fontSize)
                  .lineGap(this.lineGap)
                  .text(lineRecordSubTot, this.doc.x, this.doc.y + this.adjustLinePosY);
            }
         }

         this.cnt++;
         if (this.cnt == this.cntRecordDetails) {
            this.makeFooter(this.doc, this.req, false);
            this.cnt = 1;
            this.doc.addPage();
            this.page++;
            this.makeHeader(this.doc, this.req);
         }
      }
      //
      // Tot Group
      //
      if (this.columnGroup !== '' && this.columnsTot.length > 0) {
         this.doc.rect(0, this.doc.y, this.doc.page.width, height).fill('#ffffb4');
         this.doc.stroke();

         var lineRecordSubTot = '';
         for (const key in this.columns) {
            let colName = this.columns[key].field;
            let colDecimal = this.columns[key].decimal;
            var colTot = this.columnsTot.filter(function (col) {
               return col == colName;
            })[0];

            var val = '';
            if (colTot != null) {
               val = this.getTotField(data, groupValueOld, this.columnGroup, colTot, colDecimal);
            }

            let line = '';
            line = this.makeLineRecord(this.columns[key], val, false);
            lineRecordSubTot = lineRecordSubTot + line + ' ';
         }
         this.cntRecordDetails = this.cntRecordDetails - 1;
         this.doc
            .fillColor('black')
            .fontSize(this.fontSize)
            .lineGap(this.lineGap)
            .text(lineRecordSubTot, this.doc.x, this.doc.y + this.adjustLinePosY);
      }

      // Footer
      this.makeFooter(this.doc, this.req, true);

      // Total
      //this.makeTotal(doc, req);

      // Antes de finalizar check se tem mais paginas
      if (this.callbackGetData) {
         var ret = this.callbackGetData();
         if (!ret) {
            this.finalize();
         }
      } else {
         this.finalize();
      }
   }

   finalize() {
      var title = this.req.query._title;
      this.res.statusCode = 200;
      this.res.setHeader('Title', title);
      this.res.setHeader('Access-Control-Allow-Origin', '*');
      this.res.setHeader('Content-type', 'application/pdf');
      this.res.setHeader('Content-disposition', 'attachment; filename=' + title + '.pdf');
      this.doc.end();
   }

   makeDoc(modeLandscape) {
      let pageOpt = {};
      if (modeLandscape) {
         pageOpt = {
            size: 'A4',
            layout: 'landscape',
            margins: {
               top: 10,
               bottom: 10,
               left: 10,
               right: 10,
            },
            font: __dirname + '/Regular.ttf',
         };
      } else {
         pageOpt = {
            size: 'A4',
            margins: {
               top: 10,
               bottom: 10,
               left: 10,
               right: 10,
            },
            font: __dirname + '/Regular.ttf',
         };
      }
      const doc = new PDFDocument(pageOpt);
      return doc;
   }

   calculate(doc) {
      // Columns
      let line = this.getLineColumns();
      return this.calculateEx(doc, line);
   }

   calculateLin(doc, data) {
      // Columns
      let line = data.split('\n')[0];
      return this.calculateEx(doc, line);
   }

   calculateEx(doc, line) {
      let stop = false;
      while (!stop) {
         const ww = parseInt(doc.widthOfString(' ')) * (this.columns.length - 1);

         doc.fontSize(this.fontSize);
         const width = doc.widthOfString(line) + ww;
         let height = doc.heightOfString('M');

         this.cntRecordTotal = (doc.page.height / height).toFixed(0);

         console.log('* * * * * * * * * * * * * * * * * * * * * * * * ');
         console.log('width......: ' + width);
         console.log('height.....: ' + height);
         console.log('page.width.: ' + doc.page.width);
         console.log('page.height: ' + doc.page.height);
         console.log('fontSize...: ' + this.fontSize);
         console.log('cntRecord..: ' + this.cntRecordTotal);
         console.log('mode.......: ' + this.modeLandscape);

         if (width > doc.page.width) {
            this.fontSize = this.fontSize - 1;
            if (this.fontSize == 6 && !this.modeLandscape) {
               this.modeLandscape = true;
               this.fontSize = 12;
               doc = this.makeDoc(true);
            } else if (this.fontSize == 6 && this.modeLandscape) {
               stop = true;
            }
         } else {
            stop = true;
         }
      }

      if (this.fontSizeForce > 0) {
         this.modeLandscape = true;
         this.fontSize = this.fontSizeForce;
         doc = this.makeDoc(true);
      }

      return doc;
   }

   getLineColumns() {
      let line = '';
      for (const key in this.columns) {
         let col = this.makeLineColumn(this.columns[key]);
         line = line + col + ' ';
      }
      return line.substring(0, line.length - 1);
   }

   makeLineColumn(col) {
      return '' + this.fill(col.title, col.align, col.len);
   }

   handleData(data) {
      if (data && (typeof data === 'string' || data instanceof String)) {
         data = data.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
         data = data
            .replace(/[^\x00-\xFFFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
      }
      return data;
   }

   makeLineRecord(column, fieldValue, isTotal) {
      if (column.type == 'D') {
         if (fieldValue && fieldValue != '') {
            fieldValue = util.fDate(fieldValue);
         } else {
            fieldValue = '';
         }
      }

      if (column.type == 'DT') {
         if (fieldValue && fieldValue != '') {
            fieldValue = util.fDateTime(fieldValue);
         } else {
            fieldValue = '';
         }
      }

      if (column.type == 'V') {
         fieldValue = util.strToN(fieldValue, column.decimal);
      }

      if (isTotal) {
         var colTot = this.columnsTot.filter(function (col) {
            return col == column.field;
         });
         if (colTot.length > 0) {
            var totRec = this.totRecords[colTot[0]];
            if (totRec != null) {
               this.totRecords[column.field] = util.cToF(this.totRecords[column.field]) + util.cToF(fieldValue);
            } else {
               this.totRecords[column.field] = util.cToF(fieldValue);
            }
         }
      }
      if ((column.type == 'S' && typeof fieldValue === 'string') || fieldValue instanceof String) {
         fieldValue = '' + fieldValue.replace(/\n/g, ' ');
      }
      return '' + this.fill(fieldValue, column.align, column.len);
   }

   makeLineRecordXLS(column, fieldValue, isTotal) {
      if (column.type == 'D') {
         if (fieldValue && fieldValue != '') {
            fieldValue = util.fDate(fieldValue);
         } else {
            fieldValue = '';
         }
      }

      if (column.type == 'V') {
         fieldValue = parseFloat(fieldValue);
      }

      if ((column.type == 'S' && typeof fieldValue === 'string') || fieldValue instanceof String) {
         fieldValue = '' + fieldValue.replace(/\n/g, ' ');
      }
      return fieldValue;
   }

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
   }

   makeFooter(doc, req, isPrintTotal) {
      this.cntFooter = 1;
      if (this.columnsTot.length > 0) {
         this.cntFooter = this.cntFooter + 1;
         if (isPrintTotal) {
            this.makeLine(doc);
            var lineRecord = '';
            for (const key in this.columns) {
               let colName = this.columns[key].field;

               var colTot = this.columnsTot.filter(function (col) {
                  return col == colName;
               })[0];

               var val = '';
               if (colTot != null) {
                  val = this.totRecords[colTot].toFixed(this.columns[key].decimal).toString();
               }

               let line = '';
               line = this.makeLineRecord(this.columns[key], val, false);
               lineRecord = lineRecord + line + ' ';
            }
            let height = doc.heightOfString('M') + this.adjustLinePosY;
            doc.rect(0, doc.y, doc.page.width, height).fill('#b4ceff');
            doc.stroke();
            doc.fillColor('black').fontSize(this.fontSize).lineGap(this.lineGap).text(lineRecord);
            doc.fontSize(this.fontSize)
               .lineGap(this.lineGap)
               .text('Total Geral =>', doc.x, doc.y - height + this.adjustLinePosY);
         }
      }

      this.makeLine(doc);
      doc.fontSize(this.fontSize).text(' ').moveUp();
      doc.fontSize(this.fontSize).text('Emitido em ' + util.nowDateTime() + ' - Página ' + this.page, { align: 'right' });
   }

   makeTotal(doc, req) {
      doc.addPage();
      this.page++;
      this.makeHeader(doc, req);

      for (const key in this.totRecords) {
         let col = this.columns.filter(function (col) {
            return col.field == key;
         })[0];
         if (col) {
            doc.fontSize(this.fontSize).text(col.title.padEnd(20, '.') + ': ' + util.strToN(this.totRecords[col.field].toString(), col.decimal));
         }
      }

      this.makeLine(doc);
      doc.fontSize(this.fontSize).text('Emitido em ' + util.nowDateTime() + ' - Página ' + this.page, { align: 'right' });
   }

   makeHeader(doc, req) {
      this.cntHeader = 0;

      var title = req.query._title;
      var subTitle = req.query._subTitle;

      if (title && title !== '') this.cntHeader++;
      if (subTitle && subTitle !== '') this.cntHeader++;

      // Header
      doc.fontSize(this.fontSize).text(title);
      doc.fontSize(this.fontSize).text(subTitle);

      for (const key in req.query) {
         if (key.substring(0, 1) == '_' && key.substring(1, 2) == '_' && key.substring(2, 3) == '_') {
            var field = key.replace('___', '');
            var value = req.query[key];
            this.cntHeader++;
            doc.fontSize(this.fontSize).text(field + ': ' + value);
         }
      }

      for (const key in req.query) {
         if (key.substring(0, 1) == '_' && key.substring(1, 2) == '_' && key.substring(2, 3) != '_') {
            var field = key.replace('__', '');
            var value = req.query[key];

            value = this.formatValueHeaderFilters(field, value);
            field = this.findTitleHeaderFilters(field);

            if (field === '') {
               continue;
            }

            this.cntHeader++;
            doc.fontSize(this.fontSize).text(field + ' ' + value);
         }
      }

      // Line
      this.makeLine(doc);

      // Columns
      let line = this.getLineColumns();

      doc.fontSize(this.fontSize)
         .lineGap(this.lineGap)
         .text(line, doc.x, doc.y + this.adjustLinePosY);
      this.cntHeader++;

      // Line
      this.makeLine(doc);
   }

   makeHeaderLin(doc, req) {
      this.cntHeader = 0;

      var title = req.query._title;
      var subTitle = req.query._subTitle;

      if (title && title !== '') this.cntHeader++;
      if (subTitle && subTitle !== '') this.cntHeader++;

      // Header
      doc.fontSize(this.fontSize).text(title);
      doc.fontSize(this.fontSize).text(subTitle);

      for (const key in req.query) {
         if (key.substring(0, 1) == '_' && key.substring(1, 2) == '_' && key.substring(2, 3) == '_') {
            var field = key.replace('___', '');
            var value = req.query[key];
            this.cntHeader++;
            doc.fontSize(this.fontSize).text(field + ': ' + value);
         }
      }

      for (const key in req.query) {
         if (key.substring(0, 1) == '_' && key.substring(1, 2) == '_' && key.substring(2, 3) != '_') {
            var field = key.replace('__', '');
            var value = req.query[key];

            value = this.formatValueHeaderFilters(field, value);
            field = this.findTitleHeaderFilters(field);

            if (field === '') {
               continue;
            }

            this.cntHeader++;
            doc.fontSize(this.fontSize).text(field + ' ' + value);
         }
      }

      // Line
      this.makeLine(doc);

      // Columns
      let line = this.getLineColumns();

      doc.fontSize(this.fontSize)
         .lineGap(this.lineGap)
         .text(line, doc.x, doc.y + this.adjustLinePosY);
      this.cntHeader++;

      // Line
      this.makeLine(doc);
   }

   makeLine(doc) {
      doc.lineCap('round').lineWidth(0.7).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();
   }

   findTitleHeaderFilters(field) {
      for (const key in this.columns) {
         if (this.columns[key].field.toString().toLowerCase() + ':'.toString().toLowerCase() == field.toString().toLowerCase()) {
            return this.columns[key].title + ':';
         }
      }
      return '';
   }

   formatValueHeaderFilters(field, value) {
      for (const key in this.columns) {
         if (this.columns[key].field.toString().toLowerCase() + ':'.toString().toLowerCase() == field.toString().toLowerCase()) {
            if (this.columns[key].type == 'D') {
               return util.fDate(value);
            }
            if (this.columns[key].type == 'V') {
               return util.strToN(value, this.columns[key].decimal);
            }
         }
      }
      return value;
   }

   getTotField(data, groupValue, fieldGroup, fieldTot, colDecimal) {
      var dataCopy = [...data];
      return dataCopy
         .filter((x) => x[fieldGroup] == groupValue)
         .reduce((a, b) => {
            return (parseFloat(a) + parseFloat(b[fieldTot])).toFixed(colDecimal);
         }, 0);
   }

   getData(record, table1, table2, field) {
      if (!record[table1]) return '';
      if (!record[table1][table2]) return '';

      if (Array.isArray(record[table1][table2])) {
         return record[table1][table2][0][field] || '';
      } else {
         return record[table1][table2][field] || '';
      }
   }

   // #region - Print EXCEL
   async printListEXCEL(data, req, res) {
      this.req = req;
      this.res = res;

      // Criar array de arrays para a planilha Excel
      let worksheetData = [];

      // Adicionar cabeçalhos
      let headers = [];
      for (const key in this.columns) {
         headers.push(this.columns[key].title);
      }
      worksheetData.push(headers);

      // Adicionar dados
      for (const keyData in data) {
         let record = data[keyData];
         let row = [];

         for (const key in this.columns) {
            let colName = this.columns[key].field;
            var count = (colName.match(/\./g) || []).length;
            let cellValue = '';

            if (count == 1) {
               var table = colName.split('.')[0];
               var field = colName.split('.')[1];
               cellValue = record[table] ? this.handleData(record[table][field]) : '';
               cellValue = this.makeLineRecordXLS(this.columns[key], cellValue, true);
            } else if (count == 2) {
               var table1 = colName.split('.')[0];
               var table2 = colName.split('.')[1];
               var field = colName.split('.')[2];
               cellValue = this.handleData(this.getData(record, table1, table2, field));
               cellValue = this.makeLineRecordXLS(this.columns[key], cellValue, true);
            } else {
               cellValue = record[colName] ? this.handleData(record[colName]) : '';
               cellValue = this.makeLineRecordXLS(this.columns[key], cellValue, true);
            }

            row.push(cellValue);
         }

         worksheetData.push(row);
      }

      // Criar planilha Excel
      const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Dados');

      // Gerar buffer do arquivo Excel
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      this.finalizeExcel(excelBuffer);
   }

   finalizeExcel(excelBuffer) {
      var title = this.req.query._title || 'Exportação de dados';
      this.res.statusCode = 200;
      this.res.setHeader('Title', title);
      this.res.setHeader('Access-Control-Allow-Origin', '*');
      this.res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      this.res.setHeader('Content-disposition', 'attachment; filename=' + title + '.xlsx');
      this.res.send(excelBuffer);
   }
   // #endregion - EXCEL
}

module.exports = {
   getPrint: function (req, res) {
      return new Print(req, res);
   },
   addDataMemory: addDataMemory,
   getDataMemory: getDataMemory,
   startRemoveDataMemory: startRemoveDataMemory,
};

function addDataMemory(tableRel, data, body) {
   var aux = listDataMemory.filter(function (item) {
      return item.tableRel == tableRel;
   });
   if (aux.length == 0) {
      listDataMemory.push({ tableRel: tableRel, data: data, body: body, timeAdded: new Date().getTime() });
   } else {
      aux[0].data = data;
      aux[0].body = body;
      aux[0].timeAdded = new Date().getTime();
   }
};

function getDataMemory(tableRel) {
   var aux = listDataMemory.filter(function (item) {
      return item.tableRel == tableRel;
   })[0];

   if (aux) {
      return aux;
   } else {
      return [{ tableRel: '', data: [], body: {}, timeAdded: new Date().getTime() }];
   }
};

function startRemoveDataMemory() {
   setInterval(function () {
      console.log('Check For Remove Data in Memory: ' + listDataMemory.length);
      listDataMemory.forEach(function (item) {
         if (new Date().getTime() - item.timeAdded > 1000 * 60 * 30) {
            listDataMemory.splice(listDataMemory.indexOf(item), 1);
            console.log('Remove Data in Memory: ' + item.tableRel + ' - Qtd: ' + listDataMemory.length);
         }
      });
   }, 1000 * 60 * 10); // Verificação a cada 10 minutos
};
