const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const listModels = [];
const listModelsIn = [];
const logger = require('../utils/logger.js');
const listTablesValidDel = [];

const models = {
   Migration: function () {
      return migration();
   },
   ExportModels: function () {
      return exportModels();
   },
   addModel: function (name, model) {
      listModels.push({ table: name, model: model });
   },
   addModelIn: function (model, modelIn) {
      listModelsIn.push({ model: model, modelIn: modelIn, nameCol: null, hasOne: false });
   },
   addModelIn: function (model, modelIn, nameCol) {
      listModelsIn.push({ model: model, modelIn: modelIn, nameCol: nameCol ? nameCol : null, hasOne: false });
   },
   addModelInOne: function (model, modelIn, nameCol) {
      listModelsIn.push({ model: model, modelIn: modelIn, nameCol: nameCol, hasOne: true });
   },
   initSync: function (callback) {
      initSync(callback);
   },
   makeSQLTransf: async function (tableName, idOri, idDes, companyId) {
      return await makeSQLTransf(tableName, idOri, idDes, companyId);
   },
   canDelete: async function (tableName, id, companyId) {
      return await canDelete(tableName, id, companyId);
   },
   canDelete2: async function (tableName, id) {
      return await canDelete2(tableName, id);
   },
   seedFrom: async function (companyFrom, companyTo) {
      return await seedFrom(companyFrom, companyTo);
   },
};
module.exports = models;

async function seedFrom(companyFrom, companyTo) {
   const sequelize = require('delore-crm-core').sequelizeDB.getSequelize()
   const tables = await sequelize.query('SHOW TABLES from ' + process.env.DB_DATABASE, { type: Sequelize.QueryTypes.SELECT });

   var sql = '';

   for (var t = 0; t < tables.length; t++) {
      var table = tables[t]['Tables_in_' + process.env.DB_DATABASE];

      if (' boards , midia , msg , reasons , tags , forms , userGroup ,'.indexOf(' ' + table + ' ') === -1) {
         continue;
      }
      //
      // Nome da tabelas
      //
      sql = sql + '\nINSERT INTO ' + table + ' (';
      //
      // Pega o modelo
      //
      var model = searchModel(table, listModels);
      if (!model) continue;

      var attributes = Object.keys(model.model.fieldRawAttributesMap);

      for (var a = 0; a < attributes.length; a++) {
         var atr = attributes[a];
         if (a == attributes.length - 1) {
            sql = sql + '`' + atr + '`';
         } else {
            sql = sql + '`' + atr + '`' + ', ';
         }
      }
      sql = sql + ') SELECT null, ';

      for (var a = 0; a < attributes.length; a++) {
         var atr = attributes[a];
         if (atr === 'id') continue;

         if (atr === 'companyId') {
            atr = companyTo;
         } else {
            atr = '`' + atr + '`';
         }

         if (a == attributes.length - 1) {
            sql = sql + atr;
         } else {
            sql = sql + atr + ', ';
         }
      }

      var whereAdd = '';
      if (table == 'userGroup') {
         whereAdd = ' and cod > 1';
      }

      sql = sql + ' from ' + table + ' where companyId = ' + companyFrom + whereAdd + ';';
   }

   sql =
      sql +
      `\n
		INSERT INTO formtags (id, companyId, formsId, tagsId) 
		SELECT null, ${companyTo}, formnew.id, tagnew.id FROM formtags fta
			inner join tags tag on tag.id = fta.tagsId
			inner join forms form on form.id = fta.formsId
			inner join tags tagnew on tagnew.tag = tag.tag and tagnew.companyId = ${companyTo}
			inner join forms formnew on formnew.des = form.des and formnew.companyId = ${companyTo}
		where fta.companyId = ${companyFrom};

		INSERT INTO funnel (id, companyId, cod, seq, des, hel, sit, sta, cor, fon, ent, boardsId)
		SELECT null, ${companyTo}, fun.cod, fun.seq, fun.des, fun.hel, fun.sit, fun.sta, fun.cor, fun.fon, fun.ent, boardnew.id FROM funnel fun
		inner join boards boa on boa.id = fun.boardsId
		inner join boards boardnew on boardnew.des = boa.des and boardnew.companyId = ${companyTo}
		where fun.companyId = ${companyFrom}
	`;

   return sql;
}

async function migration() {
   const sequelize = require('delore-crm-core').sequelizeDB.getSequelize()
   try {
      logger.info('Start Migration');
      await sequelize.transaction(async (t) => {
         //
         // Lista todas tabelas do banco de dados
         //
         const tables = await sequelize.query('SHOW TABLES from ' + process.env.DB_DATABASE, { type: Sequelize.QueryTypes.SELECT });

         for (var t = 0; t < tables.length; t++) {
            //
            // Nome da tabelas
            //
            var table = tables[t]['Tables_in_' + process.env.DB_DATABASE];
            //
            // Pega o modelo
            //
            var model = searchModel(table, listModels);
            if (!model) continue;
            //
            // Pega todas colunas da table
            //
            const columns = await sequelize.query('SHOW COLUMNS FROM ' + table, {
               type: Sequelize.QueryTypes.SELECT,
            });

            var attributes = Object.keys(model.model.fieldRawAttributesMap);

            for (var a = 0; a < attributes.length; a++) {
               var atr = attributes[a];
               //
               // Checa se existe o atributo na tabela
               //
               var bExist = searchField(atr, columns);

               if (!bExist) {
                  var newAtr = model.model.fieldRawAttributesMap[atr];
                  console.log('* * * criando o campo "' + newAtr.fieldName + '" na tabela "' + table + '"');
                  var sql = makeSQLAddColumn(table, newAtr);
                  console.log(sql);
                  await sequelize.query(sql);
               }
            }
         }
      });
      logger.info('Migration Completed');
   } catch (error) {
      logger.error('Migration Error: ' + error);
   }
}

async function createIdColumns(listFieldId) {
   const sequelize = require('delore-crm-core').sequelizeDB.getSequelize()
   try {
      for (var t = 0; t < listFieldId.length; t++) {
         var table = listFieldId[t].table;
         var col = listFieldId[t].col;
         //
         // Pega todas colunas da table
         //
         const columns = await sequelize.query('SHOW COLUMNS FROM ' + table, {
            type: Sequelize.QueryTypes.SELECT,
         });

         //
         // Checa se existe o atributo na tabela
         //
         var bExist = searchField(col, columns);

         if (!bExist) {
            console.log('* * * criando o campo "' + col + '" na tabela "' + table + '"');
            var sql = makeSQLIdColumns(table, col);
            console.log(sql);
            await sequelize.query(sql);

            console.log('* * * criando o index "' + col + '" na tabela "' + table + '"');
            sql = makeSQLIdIndex(table, col);
            console.log(sql);
            await sequelize.query(sql);
         }
      }
   } catch (error) {
      console.error(error);
   }
}

function capitalizeFirstLetter(string) {
   return string.charAt(0).toUpperCase() + string.slice(1);
}

async function initSync(callback) {
   const sequelize = require('delore-crm-core').sequelizeDB.getSequelize()
   var listFieldId = [];

   for (var i = 0; i < listModelsIn.length; i++) {
      var model = searchModel(listModelsIn[i].model, listModels);
      var modelIn = searchModel(listModelsIn[i].modelIn, listModels);
      var columnsList = listModelsIn[i].nameCol;
      var hasOne = listModelsIn[i].hasOne;
      var columns = [];
      if (columnsList) {
         columns = columnsList.split(';');
      }

      if (!model || !modelIn) {
         console.warn('models não encontrado: ' + listModelsIn[i].modelIn);
      }

      if (model && modelIn) {
         if (columns.length > 0) {
            for (var j = 0; j < columns.length; j = j + 2) {
               console.log(columns[j + 1]);

               listFieldId.push({ table: modelIn.model.name, col: columns[j] });

               listTablesValidDel.push({ tableDelete: model.model.name, tableValid: modelIn.model.name, col: columns[j] });

               if (hasOne) {
                  model.model.hasOne(modelIn.model, { foreignKey: columns[j], as: columns[j + 1], constraints: false });
                  modelIn.model.belongsTo(model.model, { foreignKey: columns[j], as: columns[j + 1], constraints: false });
               } else {
                  model.model.hasMany(modelIn.model, { foreignKey: columns[j], as: columns[j + 1], constraints: true });
                  modelIn.model.belongsTo(model.model, { foreignKey: columns[j], as: columns[j + 1], constraints: true });
               }
            }
         } else {
            var col = model.model.name + 'Id';
            var table = capitalizeFirstLetter(model.model.name) + capitalizeFirstLetter(modelIn.model.name);

            listFieldId.push({ table: modelIn.model.name, col: col });

            listTablesValidDel.push({ tableDelete: model.model.name, tableValid: modelIn.model.name, col: col });

            console.log(table);
            if (hasOne) {
               model.model.hasOne(modelIn.model, { foreignKey: col, as: table, constraints: true });
               modelIn.model.belongsTo(model.model, { foreignKey: col, as: table, constraints: true });
            } else {
               model.model.hasMany(modelIn.model, { foreignKey: col, as: table, constraints: true });
               modelIn.model.belongsTo(model.model, { foreignKey: col, as: table, constraints: true });
            }
         }
      } else {
         console.log('models não encontrado');
      }
   }

   sequelize
      .sync({ force: false, alter: false })
      .then(async () => {
         //
         // Create Id Columns
         //
         if (listFieldId.length > 0) {
            if (process.argv[2] == undefined) {
               await createIdColumns(listFieldId);
            }
         }
         //
         // Create Views
         //
         await createViews();
         //
         // Create Index
         //
         await createIndex();

         callback();
      })
      .catch((err) => {
         logger.error(err);
      });
}

async function createIndex() {
   const sequelize = require('delore-crm-core').sequelizeDB.getSequelize()
   await sequelize.query(generateCreateIndexIfNotExistsSQL('zapchat', 'idx_zapchat_msgId', ['msgId'], process.env.DB_DATABASE));
   await sequelize.query(generateCreateIndexIfNotExistsSQL('zapchat', 'idx_zapchat_companyId_ori', ['companyId', 'ori'], process.env.DB_DATABASE));
   await sequelize.query(generateCreateIndexIfNotExistsSQL('zapchat', 'idx_zapchat_company_tel_dat', ['companyId', 'tel', 'dat DESC'], process.env.DB_DATABASE));

   await sequelize.query(generateCreateIndexIfNotExistsSQL('funnelmov', 'idx_funnelmov_leads_seq', ['leadsId', 'seq'], process.env.DB_DATABASE));
   await sequelize.query(generateCreateIndexIfNotExistsSQL('funnelmov', 'idx_funnelmov_main', ['companyId', 'leadsId', 'seq DESC'], process.env.DB_DATABASE));

   await sequelize.query(generateCreateIndexIfNotExistsSQL('leads', 'idx_leads_company_lastmsg', ['companyId', 'datLastMsgWhatsApp DESC'], process.env.DB_DATABASE));
   await sequelize.query(generateCreateIndexIfNotExistsSQL('leads', 'idx_leads_company_cod_desc', ['companyId', 'cod DESC'], process.env.DB_DATABASE));
}

function generateCreateIndexIfNotExistsSQL(tableName, indexName, columns, dbName) {
   if (!tableName || !indexName || !Array.isArray(columns) || columns.length === 0 || !dbName) {
      throw new Error('Parâmetros inválidos. Informe nome da tabela, índice, colunas e banco de dados.');
   }

   const columnList = columns.map((col) => `${col}`).join(', ');
   const sql = `
SET @index_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE table_schema = '${dbName}' 
    AND table_name = '${tableName}' 
    AND index_name = '${indexName}'
);

SET @create_index_sql := IF(@index_exists = 0, 
  'CREATE INDEX ${indexName} ON ${tableName} (${columnList})', 
  'SELECT "Index already exists."'
);

PREPARE stmt FROM @create_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
`;
   return sql.trim();
}

function makeSQLAddColumn(table, atr) {
   var def = ' NULL ;';
   if (atr.defaultValue == 'NOW') {
      def = ' DEFAULT (current_date);';
   }
   return 'ALTER TABLE ' + table + ' ADD COLUMN ' + atr.fieldName + ' ' + atr.type.toString() + def;
}

function makeSQLIdColumns(table, fieldName) {
   return 'ALTER TABLE ' + table + ' ADD COLUMN ' + fieldName + ' ' + 'BIGINT(11)' + ' NULL;';
}

function makeSQLIdIndex(table, fieldName) {
   return 'ALTER TABLE ' + table + ' ADD INDEX  ' + fieldName + ' (' + fieldName + ');';
}

function searchField(nameKey, myArray) {
   for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].Field === nameKey) {
         return myArray[i];
      }
   }
}

function searchModel(nameKey, myArray) {
   for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].table === nameKey) {
         return myArray[i];
      }
   }
}

async function createViews() {
   const sequelize = require('delore-crm-core').sequelizeDB.getSequelize()
   try {
      await sequelize.transaction(async (t) => {
         //
         // Lista todas views já criadas
         //
         const views = await sequelize.query('SHOW FULL TABLES IN ' + process.env.DB_DATABASE + " WHERE TABLE_TYPE LIKE 'VIEW';", { type: Sequelize.QueryTypes.SELECT });
         //
         // Lista diretório com as views
         //
         const directoryPath = path.join(__dirname, '../views');
         var files = fs.readdirSync(directoryPath);
         if (files) {
            for (var i = 0; i < files.length; i++) {
               var file = files[i];
               var viewName = file.split('.')[0];

               var listViewExist = views.filter((view) => {
                  var nameCol = 'Tables_in_' + process.env.DB_DATABASE;
                  return view[nameCol] === viewName;
               });

               if (listViewExist.length == 0) {
                  console.log('* * * criando a view ' + viewName);
                  var sql = fs.readFileSync(directoryPath + '/' + file, 'utf8');
                  console.log(sql);
                  await sequelize.query(sql);
               }
            }
         }
      });
   } catch (error) {
      console.error(error);
   }
}

async function exportModels() {
   logger.info('Start Export Models');
   try {
      for (var i = 0; i < listModels.length; i++) {
         var model = listModels[i];
         // if (model.model.name != 'contract') {
         //     continue;
         // }
         var colAdd = [];
         for (var x = 0; x < listModelsIn.length; x++) {
            if (model.table == listModelsIn[x].modelIn) {
               var modelXName = listModelsIn[x].model;
               var modelX = searchModel(modelXName, listModels);
               if (modelX) {
                  var columsList = listModelsIn[x].nameCol;
                  var colums = [];
                  if (columsList) {
                     colums = columsList.split(';');
                  }
                  if (model && modelX) {
                     if (colums.length > 0) {
                        for (var j = 0; j < colums.length; j = j + 2) {
                           var col = colums[j];
                           if (col != 'companyId') {
                              colAdd.push({ fieldName: col, field: modelX.model.fieldRawAttributesMap['id'], comment: modelX.model.options.comment + ';' + 'search' });
                           }
                        }
                     } else {
                        var col = modelX.model.name + 'Id';
                        if (col != 'companyId') {
                           colAdd.push({ fieldName: col, field: modelX.model.fieldRawAttributesMap['id'], comment: modelX.model.options.comment + ';' + 'search' });
                        }
                     }
                  }
               }
            }
         }

         var modelDefinition = '';
         var formControls = '';
         var formControlsAdd = '';
         var formHTML = '';

         var colSorted = [];
         var colFilter = [];
         var colData = [];

         for (const key in model.model.fieldRawAttributesMap) {
            const field = model.model.fieldRawAttributesMap[key];
            if (field.fieldName == 'id') {
               continue;
            }
            var comment = '';
            var typeField = '';
            if (field.comment) {
               comment = field.comment.split(';')[0];
               typeField = field.comment.split(';')[1];
            } else {
               continue;
            }
            modelDefinition += field.fieldName + ': ' + getType(field.type, field.defaultValue, false) + ' // ' + comment + '\n';

            var required = field.allowNull ? '' : 'Validators.required';
            var patterns = getValPatterns(field.type);

            var coma = '';
            if (required != '' && patterns != '') {
               coma = ', ';
            }
            var validators = required + coma + patterns;
            formControls += field.fieldName + " = new UntypedFormControl('', [" + validators + ']' + ');\n';

            formControlsAdd += 'this.valService.addG(this.formMain, this.' + field.fieldName + ", '" + field.fieldName + "', '" + comment + "');\n";

            formHTML += getForm(field.fieldName, typeField, comment);

            colSorted.push(getSortedColumn(field.fieldName, comment));

            if (field.type.constructor.key == 'DATEONLY') {
               colFilter.push(getFilterColumnDate(field.fieldName, comment));
            } else {
               colFilter.push(getFilterColumnText(field.fieldName, comment));
            }

            if (field.type.constructor.key == 'DECIMAL') {
               colData.push(getContentNumber(field.fieldName));
            } else {
               colData.push(getContentText(field.fieldName));
            }
         }

         var table = getTable(colSorted, colFilter, colData);

         for (const key in colAdd) {
            const item = colAdd[key];

            var comment = '';
            var typeField = '';
            if (item.comment) {
               comment = item.comment.split(';')[0];
               typeField = item.comment.split(';')[1];
            }

            modelDefinition += item.fieldName + ': ' + getType(item.field.type, item.field.defaultValue, true) + ' // ' + comment + '\n';

            var required = item.field.allowNull ? '' : 'Validators.required';
            var patterns = getValPatterns(item.field.type);

            var coma = '';
            if (required != '' && patterns != '') {
               coma = ', ';
            }
            var validators = required + coma + patterns;
            formControls += item.fieldName + " = new UntypedFormControl('', [" + validators + ']' + ');\n';

            formControlsAdd += 'this.valService.addG(this.formMain, this.' + item.fieldName + ", '" + item.fieldName + "', '" + comment + "');\n";

            formHTML += getForm(item.fieldName, typeField, comment);
         }

         if (!fs.existsSync('../ngmodels')) {
            fs.mkdirSync('../ngmodels');
         }
         fs.writeFile('../ngmodels/' + model.model.name + '_table.txt', table, function (err) {
            //console.log('NG Table Saved ');
         });

         fs.writeFile('../ngmodels/' + model.model.name + '_model.txt', modelDefinition, function (err) {
            //console.log('NG Model Saved ');
         });

         fs.writeFile('../ngmodels/' + model.model.name + '_formcontrol.txt', formControls, function (err) {
            //console.log('NG Controls Saved ');
         });

         fs.writeFile('../ngmodels/' + model.model.name + '_formcontroladd.txt', formControlsAdd, function (err) {
            //console.log('NG FormControl Saved ');
         });

         fs.writeFile('../ngmodels/' + model.model.name + '_html.txt', formHTML, function (err) {
            //console.log('NG HTML Saved ');
         });
      }
      logger.info('Export Models Completed');
   } catch (error) {
      logger.error('Export Models Error: ' + error);
   }
}

function getType(type, defaultValue, addColumn) {
   if (defaultValue == undefined) {
      if (type.constructor.key == 'INTEGER' || type.constructor.key == 'BIGINT' || type.constructor.key == 'DECIMAL') {
         defaultV = 0;
      } else if (type.constructor.key == 'BOOLEAN') {
         defaultV = 'false';
      } else {
         defaultV = "''";
      }
   } else {
      if (type.constructor.key == 'INTEGER' || type.constructor.key == 'BIGINT' || type.constructor.key == 'DECIMAL') {
         defaultV = defaultValue;
      } else if (type.constructor.key == 'BOOLEAN') {
         defaultV = defaultValue;
      } else {
         defaultV = "'" + defaultValue + "'";
      }
   }

   if (type.constructor.key == 'DATEONLY') return 'Date | any = null;';
   if (type.constructor.key == 'INTEGER') return 'number = ' + defaultV + ';';
   if (addColumn) {
      if (type.constructor.key == 'BIGINT') return 'number | any  = null;';
   } else {
      if (type.constructor.key == 'BIGINT') return 'number = ' + defaultV + ';';
   }
   if (type.constructor.key == 'DECIMAL') return 'number = ' + defaultV + ';';
   if (type.constructor.key == 'STRING') return 'string = ' + defaultV + ';';
   if (type.constructor.key == 'TEXT') return 'string = ' + defaultV + ';';
   if (type.constructor.key == 'BOOLEAN') return 'boolean = ' + defaultV + ';';

   return 'any = null;';
}

function getValPatterns(type) {
   if (type.constructor.key == 'DATEONLY') return 'Validators.pattern(this.valService.DATA)';
   if (type.constructor.key == 'STRING') {
      if (type.options.length && type.options.length < 10) {
         return 'Validators.pattern(this.valService.DES0' + type.options.length + ')';
      } else if (type.options.length) {
         return 'Validators.pattern(this.valService.DES' + type.options.length + ')';
      } else {
         return '';
      }
   }
   return '';
}

function getForm(fieldName, typeField, comment) {
   if (typeField == 'msk') return getFormMsk(fieldName, comment) + '\n';
   if (typeField == 'text') return getFormText(fieldName, comment) + '\n';
   if (typeField == 'area') return getFormArea(fieldName, comment) + '\n';
   if (typeField == 'number') return getFormNumber(fieldName, comment) + '\n';
   if (typeField == 'date') return getFormDate(fieldName, comment) + '\n';
   if (typeField == 'multselect') return getFormMultSelect(fieldName, comment) + '\n';
   if (typeField == 'select') return getFormSelect(fieldName, comment) + '\n';
   if (typeField == 'search') return getFormSearch(fieldName, comment) + '\n';
   if (typeField == 'radio') return getFormRadio(fieldName, comment) + '\n';
   if (typeField == 'check') return getFormCheck(fieldName, comment) + '\n';
   return '';
}

function getFormMsk(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
    <label>${name}</label>
    <p-inputMask
        inputId="${field}"
        erp="${field}"
        #${field}ER
        [formControl]="${field}"
        mask="?9999"
        (keypress)="keyPress($event)"
    ></p-inputMask>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormText(field, name) {
   return (
      `<div class="p-field erp-field">
    <label>${name}</label>
    <input
        #${field}ER
        id="${field}"
        erp="${field}"
        type="text"
        pInputText
        [formControl]="${field}"
        (keypress)="keyPress($event)"
    />
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormNumber(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
    <label>${name}</label>
    <p-inputNumber
        #${field}ER
        inputId="${field}"
        erp="${field}"
        [formControl]="${field}"
        mode="decimal"
        [minFractionDigits]="2"
        [maxFractionDigits]="2"
        (keypress)="keyPress($event)"
    ></p-inputNumber>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormDate(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
    <label>${name}</label>
    <div>
        <p-calendar
            #${field}ER
            inputId="${field}"
            erp="${field}"
            appendTo="body"
            [formControl]="${field}"
            dateFormat="dd/mm/yy"
            dataType="string"
            (keypress)="keyPress($event)"
        ></p-calendar>
    </div>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormMultSelect(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
    <label>${name}</label>
    <p-multiSelect
        #${field}ER
        inputId="${field}"
        [options]="[
            { code: '1', name: 'name' },
        ]"
        formControlName="${field}"
        optionLabel="name"
        optionValue="code"
    ></p-multiSelect>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field"
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormSelect(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
    <label>${name}</label>
    <p-dropdown
        #${field}ER
        inputId="${field}"
        [options]="[
            { code: '1', name: 'name' },
        ]"
        formControlName="${field}"
        optionLabel="name"
        optionValue="code"
    ></p-dropdown>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormSearch(field, name) {
   return (
      `<div class="p-field erp-field">
    <label>${name}</label>
    <app-delore-search
        #${field}ER
        [control]="${field}"
        [valid]="isValidxxx"
        title="Lista de xxx"
        fieldValid="cod"
        fieldCaption="des"
        fieldFilter="companyId"
        [fieldFilterValue]="companyId.value"
        table="xxx"
        fieldList="cod:Código,des:Descrição"
    ></app-delore-search>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormRadio(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
    <div class="erp-field-radio-label">${name}</div>
	 <div class="erp-field-col">
    <p-radioButton
        labelStyleClass="erp-radio"
        name="${field}-g"
        value="Sim"
        label="Sim"
        [formControl]="${field}"
    ></p-radioButton>
    <p-radioButton
        labelStyleClass="erp-radio"
        name="${field}-g"
        value="Não"
        label="Não"
        [formControl]="${field}"
    ></p-radioButton>
	 </div>
    <div *ngIf="val.hasError('${field}')" id="${field}-h" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormCheck(field, name) {
   return (
      `<div class="p-field erp-field" style="width: 180px">
		<div class="erp-field-col">
    <p-checkbox
        #${field}ER
        label="${name}"
        inputId="${field}"
        formControlName="${field}"
        [binary]="true"
        (keypress)="keyPress($event)"
    ></p-checkbox>
	 </div>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getFormArea(field, name) {
   return (
      `
<div class="p-field erp-field-textarea">
    <label>${name}</label>
    <textarea
        #${field}ER
        pInputTextarea
        [formControl]="${field}"
        [rows]="3"
    ></textarea>
    <div *ngIf="val.hasError('${field}')" class="erp-error-field">
        {{ val.getError("${field}") }}
    </div>
</div>` + '\n\n'
   );
}

function getTable(sorted, filter, content) {
   return `
        <ng-template pTemplate="header">
            <tr>
                ${sorted.join('')}
            </tr>
            <tr>
                ${filter.join('')}
            </tr>
        </ng-template>

        <ng-template pTemplate="body" let-modelForm>
            <tr [pSelectableRow]="modelForm">
                ${content.join('')}
            </tr>
        </ng-template>
`;
}

function getSortedColumn(field, name) {
   return (
      `
<th pResizableColumn pSortableColumn="${field}" style="width: 180px">
    ${name}<p-sortIcon field = "${field}" ></p-sortIcon >
</th> ` + '\n'
   );
}

function getFilterColumnText(field) {
   return (
      `
<th>
    <p-columnFilter erpCF type="text" field="${field}"></p-columnFilter>
</th>` + '\n'
   );
}

function getFilterColumnDate(field) {
   return (
      `
<th>
    <p-columnFilter erpCF
        [showAddButton]="false"
        [showOperator]="false"
        display="menu"
        display="menu"
        type="date"
        field="${field}"
    ></p-columnFilter>
</th>` + '\n'
   );
}

function getContentText(field) {
   return `<td>{{ modelForm.${field} }}</td>` + '\n';
}

function getContentNumber(field) {
   return `<td>{{ val.strToN(modelForm.${field}, 2) }}</td>` + '\n';
}

async function canDelete(tableName, id, companyId) {
   var sql = 'Select sum(sub) total from (';

   var subSQL = '';
   listTablesValidDel.forEach((table) => {
      if (table.tableDelete === tableName) {
         subSQL += `SELECT COUNT(*) AS sub FROM ${table.tableValid} WHERE ${table.col} = ${id} AND companyId = ${companyId} \nunion all\n`;
      }
   });

   sql += subSQL.substring(0, subSQL.length - 10);

   sql = sql + ') tot';

   if (subSQL == '') {
      return true;
   }

   var data = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
   });

   if (data.length === 0) {
      return true;
   } else {
      return parseInt(data[0].total) === 0 ? true : false;
   }
}

async function makeSQLTransf(tableName, idOri, idDes, companyId) {
   var sql = '';
   listTablesValidDel.forEach((table) => {
      if (table.tableDelete === tableName) {
         sql += `UPDATE ${table.tableValid} set ${table.col} = ${idDes} WHERE ${table.col} = ${idOri} AND companyId = ${companyId};\n`;
      }
   });
   return sql;
}

async function canDelete2(tableName, id) {
   var sql = 'Select sum(sub) total from (';

   var subSQL = '';
   listTablesValidDel.forEach((table) => {
      if (table.tableDelete === tableName) {
         subSQL += `SELECT COUNT(*) AS sub FROM ${table.tableValid} WHERE ${table.col} = ${id} \nunion all\n`;
      }
   });

   sql += subSQL.substring(0, subSQL.length - 10);

   sql = sql + ') tot';

   if (subSQL == '') {
      return true;
   }

   var data = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
   });

   if (data.length === 0) {
      return true;
   } else {
      return parseInt(data[0].total) === 0 ? true : false;
   }
}
