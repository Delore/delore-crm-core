'use strict';
const Sequelize = require('sequelize');
const access = require('../utils/access');
const util = require('../utils/util');
const models = require('../db/models.js');

module.exports = {
    _service: null,
    _modelMain: null,
    _sequelize: null,

    init(service) {
        this._sequelize = require('../db/sequelize_db.js').getSequelize();
        this._modelMain = this._sequelize.define(
            'access',
            {
                id: { type: Sequelize.STRING(10), primaryKey: true, comment: util.commentText('ID') },
                type: { type: Sequelize.STRING(10), allowNull: false, comment: util.commentText('Tipo') },
                method: { type: Sequelize.STRING(10), allowNull: false, comment: util.commentText('Método') },
                path: { type: Sequelize.STRING, allowNull: false, comment: util.commentText('Rota') },
                name: { type: Sequelize.STRING, allowNull: false, comment: util.commentText('Nome') },
                desc: { type: Sequelize.STRING, allowNull: false, comment: util.commentText('Descrição') },
                group: { type: Sequelize.STRING, allowNull: false, comment: util.commentText('Grupo') },
                accessControl: { type: Sequelize.BOOLEAN, allowNull: false, comment: util.commentText('Controle Acesso') },
                general: { type: Sequelize.BOOLEAN, allowNull: false, comment: util.commentText('Geral') },
                opened: { type: Sequelize.BOOLEAN, allowNull: false, comment: util.commentText('Aberto') },
                isMenu: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false, comment: util.commentText('Menu') },
                service: { type: Sequelize.STRING(40), allowNull: true, comment: util.commentText('Serviço') },
            },
            { comment: 'access' }
        ); // Nome do campo que será usado para a pesquisa em outra tabela - Componente DeloreSearch

        this._service = service;
        models.addModel(this._modelMain.name, this._modelMain);
    },

    model() {
        return this._modelMain;
    },

    async sync() {
        try {
            await this._sequelize.transaction(async (t) => {

                var listUser = await this._sequelize.query(`SELECT id, access FROM user WHERE sit = "Ativo"`, {
                    type: Sequelize.QueryTypes.SELECT,
                    transaction: t
                });

                var listGroup = await this._sequelize.query(`SELECT id, access FROM userGroup WHERE sit = "Ativo"`, {
                    type: Sequelize.QueryTypes.SELECT,
                    transaction: t
                });

                const listMem = access.getAccess();
                const listDB = await this._modelMain.findAll({
                    where: {
                        service: this._service
                    },
                    transaction: t
                });

                // Adiciona ou altera items da memoria para o DB
                for (let i = 0; i < listMem.length; i++) {
                    const accessMem = listMem[i];
                    var exist = listDB.find((x) => x.id === accessMem.id);
                    if (!exist) {
                        accessMem.service = this._service;
                        await this._modelMain.create(accessMem, { transaction: t });
                    } else {
                        if (!isEquals(exist.dataValues, accessMem)) {
                            accessMem.opened = false;
                            accessMem.service = this._service;
                            await this._modelMain.update(accessMem, {
                                where: {
                                    id: accessMem.id
                                },
                                transaction: t
                            });
                        }
                    }
                }

                // Deleta items não existente na memoria
                for (let index = 0; index < listDB.length; index++) {
                    const accessDB = listDB[index];
                    var exist = listMem.find((x) => x.id === accessDB.id);
                    if (!exist) {
                        await this._modelMain.destroy({ where: { id: accessDB.id }, transaction: t });
                    }
                }

                var listAccessOpened = [];
                const listDBChanged = await this._modelMain.findAll({
                    where: {
                        opened: true,
                        service: this._service
                    },
                    transaction: t
                });

                for (let index = 0; index < listDBChanged.length; index++) {
                    listAccessOpened.push(listDBChanged[index].id);
                }

                if (listAccessOpened.length > 0) {
                    //
                    // Atualiza o usuário com o novo acesso - caso tenha novos acessos abertos
                    //
                    for (let index = 0; index < listUser.length; index++) {
                        const user = listUser[index];
                        const accessUser = eval(user.access);
                        const accessMerged = accessUser.concat(listAccessOpened);
                        await this._sequelize.query(`UPDATE user SET access = :access WHERE id = :id`, {
                            type: Sequelize.QueryTypes.UPDATE,
                            replacements: {
                                access: JSON.stringify(accessMerged),
                                id: user.id
                            },
                            transaction: t
                        });
                    }
                    //
                    // Atualiza o grupo com o novo acesso - caso tenha novos acessos abertos
                    //
                    for (let index = 0; index < listGroup.length; index++) {
                        const group = listGroup[index];
                        var accessGroup = eval(group.access);
                        const accessMerged = accessGroup.concat(listAccessOpened);
                        await this._sequelize.query(`UPDATE userGroup SET access = :access WHERE id = :id`, {
                            type: Sequelize.QueryTypes.UPDATE,
                            replacements: {
                                access: JSON.stringify(accessMerged),
                                id: group.id
                            },
                            transaction: t
                        });
                    }
                    //
                    // Fecha todos os acessos abertos - caso tenha novos acessos abertos
                    //
                    var sql = 'UPDATE access SET opened=false WHERE opened=true AND service = :service';
                    await this._sequelize.query(sql, {
                        type: Sequelize.QueryTypes.UPDATE,
                        replacements: {
                            service: this._service
                        },
                        transaction: t,
                    });
                }
                console.log('Sincronismo de acessos do serviço ' + this._service + ' ===================> OK');
            });
        } catch (error) {
            console.error('Sincronismo de acessos do serviço ' + this._service + ' ===================> Error: ' + error);
        }

    }
};

function isEquals(obj1, obj2) {
    return (
        obj1.accessControl === obj2.accessControl &&
        obj1.desc === obj2.desc &&
        obj1.general === obj2.general &&
        obj1.group === obj2.group &&
        obj1.id === obj2.id &&
        obj1.method === obj2.method &&
        obj1.name === obj2.name &&
        obj1.path === obj2.path &&
        obj1.type === obj2.type &&
        obj1.isMenu === obj2.isMenu
    );
}