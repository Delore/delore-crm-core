'use strict';
const express = require('express');
const router = express.Router();
const shorthash2 = require('shorthash2');

const util = require('./util');
var list = [];
var serviceName = '';

exports.const = {
    GROUPSYS: 'Sistema',
    GROUPCAD: 'Cadastros',
    GROUPOPE: 'Operacional',
    GROUPUTL: 'Utils',
    GROUPESP: 'Especiais',
    GROUPCON: 'Consultas',
    GROUPADM: 'Gerencial',
};

exports.setServiceName = function (serviceName) {
    this.serviceName = serviceName;
};

// Configura acesso para rotas/todos usuários
exports.add = function (method, path, name, desc, group, fn) {
    list.push({ service: serviceName, id: shorthash2(method + path), type: 'router', accessControl: true, method: method, path: path, name: name, desc: desc, group: group, fn: fn, general: false, opened: false, isMenu: false });
};

exports.addMenu = function (method, path, name, desc, group, fn) {
    list.push({ service: serviceName, id: shorthash2(method + path), type: 'router', accessControl: true, method: method, path: path, name: name, desc: desc, group: group, fn: fn, general: false, opened: false, isMenu: true });
};

// Configura acesso para rotas/todos usuários - Liberada por Padrão para usuário ativos já cadastrados
exports.addOpen = function (method, path, name, desc, group, fn) {
    list.push({ service: serviceName, id: shorthash2(method + path), type: 'router', accessControl: true, method: method, path: path, name: name, desc: desc, group: group, fn: fn, general: false, opened: true, isMenu: false });
};

// Configura acesso para rotinas
exports.addEsp = function (name, desc, group) {
    var id = shorthash2(name, desc, group);
    list.push({ service: serviceName, id: id, type: 'esp', accessControl: true, method: 'esp', path: '', name: name, desc: desc, group: group, fn: null, general: false, opened: false });
    return id;
};

// Configura acesso para rotas liberadas para todos usuários
exports.addNoAccessControl = function (method, path, fn) {
    list.push({ service: serviceName, id: shorthash2(method + path), type: 'router', accessControl: false, method: method, path: path, name: '', desc: '', group: '', fn: fn, general: false, opened: false, isMenu: false });
};

exports.makeRouter = function () {
    for (var i = 0; i < list.length; i++) {
        if (list[i].method == 'get') {
            router.get(list[i].path, list[i].fn);
        } else if (list[i].method == 'post') {
            router.post(list[i].path, list[i].fn);
        } else if (list[i].method == 'put') {
            router.put(list[i].path, list[i].fn);
        } else if (list[i].method == 'delete') {
            router.delete(list[i].path, list[i].fn);
        }
    }
    return router;
};

exports.makeAccessScope = function () {
    var ret = '[';
    for (var i = 0; i < list.length; i++) {
        if (list[i].accessControl) {
            if (i == 0) {
                ret = ret + '"' + list[i].id + '"';
            } else {
                ret = ret + ', ' + '"' + list[i].id + '"';
            }
        }
    }
    ret = ret + ']';
    return ret;
};

exports.makeAccessScopeAll = function () {
    var ret = '[';
    for (var i = 0; i < list.length; i++) {
        if (list[i].accessControl) {
            if (i == 0) {
                ret = ret + '"' + list[i].id + '#' + list[i].name + '#' + list[i].desc + '#' + list[i].group + '#' + list[i].isMenu + '"';
            } else {
                ret = ret + ', ' + '"' + list[i].id + '#' + list[i].name + '#' + list[i].desc + '#' + list[i].group + '#' + list[i].isMenu + '"';
            }
        }
    }
    ret = ret + ']';
    return ret;
};

exports.getAccess = function () {
    return list;
};

exports.getResourceFromReq = function (req) {
    var ret = {};
    var urlReq = util.getUrlFromReq(req.baseUrl);

    if (urlReq == '') {
        ret.accessControl = false;
        ret.id = '';
        ret.group = '';
        ret.name = '';
        ret.desc = '';
        ret.general = false;
        ret.service = '';
        return ret;
    }

    for (var i = 0; i < list.length; i++) {
        if (list[i].accessControl) {
            ret.accessControl = true;
            var urls = util.getUrlFromReq(list[i].path);
            if (urlReq == urls && list[i].method == req.method.toLowerCase()) {
                ret.id = list[i].id;
                ret.group = list[i].group;
                ret.name = list[i].name;
                ret.desc = list[i].desc;
                ret.general = list[i].general;
                ret.service = list[i].service;
                break;
            }
        } else {
            ret.accessControl = false;
            ret.id = '';
            ret.group = '';
            ret.name = '';
            ret.desc = '';
            ret.general = false;
            ret.service = '';
        }
    }
    return ret;
};
