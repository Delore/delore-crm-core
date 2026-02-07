var jwt = require('jwt-simple');
const access = require('../utils/access');
const authControl = require('./auth.control.js');

exports.returnOK = function (res, msg) {
   try {
      res.status(200).send({ success: true, msg: msg, data: null, pages: -1 });
   } catch (error) {
      console.error(error);
   }
   return false;
};

exports.returnOKRel = function (res, msg, data, tableName) {
   res.status(200).send({ success: true, msg: msg, data: data, pages: -1, tableName: tableName });
   return false;
};

exports.returnOK = function (res, msg, data, pages) {
   res.status(200).json({ success: true, msg: msg, data: data, pages: pages });
   return false;
};

exports.returnOK = function (res, msg, data, pages, bof, eof) {
   res.status(200).json({ success: true, msg: msg, data: data, pages: pages, bof: bof, eof: eof });
   return false;
};

exports.returnOKPag = function (res, result) {
   res.status(200).json({ success: true, msg: result.msg, data: result.rows, pages: result.pages, count: result.count });
   return false;
};

exports.returnNOKPag = function (res) {
   var result = {};
   result.rows = [];
   result.count = 0;
   result.msg = 'Sem registros';
   res.status(200).json({ success: false, msg: result.msg, data: result.rows, pages: result.pages, count: result.count });
   return false;
};

exports.returnNOK = function (res, msg) {
   res.status(200).json({ success: false, msg: msg, data: null, pages: -1 });
   return false;
};

exports.returnNOKBlob = function (res, msg) {
   res.statusMessage = msg;
   res.status(410).send();
   return false;
};

exports.returnMobileNOKBlob = function (res, msg) {
   res.statusMessage = msg;
   res.statusCode = 200;
   res.setHeader('Content-type', 'application/pdf');
   res.setHeader('Content-Length', 0);
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Title', 'Apostila/Material');
   res.setHeader('FileName', 'Arquivo Vazio');
   res.setHeader('Content-disposition', 'attachment; filename=Arquivo Vazio');
   res.send();
   return false;
};

exports.returnHandleError = function (res, error) {
   var errorMsg = error.message; //'Erro ao salvar';

   if (error && error.original && error.original.code && error.original.code === 'ER_DUP_ENTRY') {
      errorMsg = 'Registro duplicado';
   }

   res.status(200).json({ success: false, msg: errorMsg, data: null, pages: -1 });
   return false;
};

exports.returnLogin = async function (dados, owner, user, board, exp, lat, lng, ip) {
   try {
      var tokenDados = {
         exp: exp,
         sub: dados.id,
         userId: user ? user.id : null,
         access: user.access,
      };
      var serialize = JSON.stringify(tokenDados);
      var secret = await authControl.addSecret(dados.id, user.id, lat, lng, ip);
      var token = jwt.encode(serialize, secret);
      return {
         token: token,
         id: dados.id,
         sysname: owner.sysname,
         raz: dados.raz,
         fan: dados.fan,
         cpj: dados.cpj,
         ema: dados.ema,

         userId: user.id,
         userName: user.name,
         userEmail: user.user,

         inst: user ? user.inst : null,
         instView: user ? user.instView : null,
         visLea: user.visLea,
         access: user.access,
         accessAll: access.makeAccessScopeAll(),
         fChangePass: user.fChangePass,
         datePass: user.datePass,
         qtdreg: user.qtdreg,
         ordKanban: user.ordKanban,
         boards: user.boards || [],
         boardId: board ? board.id : null,
         boardDes: board ? board.des : null,
      };
   } catch (e) {
      return null;
   }
};

exports.validToken = async function (req) {
   try {
      if (!req.headers.token || req.headers.token === 'undefined' || req.headers.token == '') {
         return { status: 401, message: 'Não foi informado token' };
      }

      var secret = await authControl.getSecret(req.headers.id, req.headers.userid, req.headers.lat, req.headers.lng, req.headers.ip);
      if (secret == '') {
         return { status: 401, message: 'Código 001 - Token expirado, por favor faça o login novamente' };
      }

      var resource = access.getResourceFromReq(req);
      var token = JSON.parse(jwt.decode(req.headers.token, secret));
      var now = Date.now();
      var id = req.headers.id;
      var userId = req.headers.userid;
      var tokenAccess = token.access;

      if (now > token.exp) {
         return { status: 401, message: 'Código 002 - Token expirado! por favor faça o login novamente.' };
      } else if (id == '') {
         return { status: 401, message: 'Acesso indevido!' };
      } else if (token.userId != userId) {
         return { status: 401, message: 'Acesso indevido!' };
      } else if (token.sub != id) {
         return { status: 401, message: 'Acesso indevido!' };
      } else {
         if (tokenAccess.includes(resource.id) || !resource.accessControl) {

            return { status: 200, message: 'Token válido' };

         } else {
            return {
               status: 401,
               message: 'Acesso ao recurso não permitido! por favor, entre em contato com seu administrador.' + '\n - Grupo: ' + resource.group + '\n - Recurso: ' + resource.name + '\n - Descrição: ' + resource.desc,
            };
         }
      }
   } catch (error) {
      console.error(error);
      return { status: 500, message: 'Token inválido!' };
   }
};

exports.makeTokenSocketIo = function (id) {
   try {
      var tokenDados = {
         sub: id,
         exp: new Date().getTime() + 1000 * 60 * 60 * 24 * 30, // 30 dias
      };
      var serialize = JSON.stringify(tokenDados);
      var token = jwt.encode(serialize, 'socketIoCrm23');
      return token;
   } catch (e) {
      return null;
   }
};

exports.validTokenSocketIo = function (tokenSend, idSend) {
   try {
      if (tokenSend == 'undefined' || tokenSend == '') {
         return { status: 401, message: 'Não foi informado token' };
      }

      var token = JSON.parse(jwt.decode(tokenSend, 'socketIoCrm23'));
      var now = Date.now();
      var id = idSend;

      if (now > token.exp) {
         return { status: 400, message: 'Token expirado' };
      } else if (id == '') {
         return { status: 401, message: 'Não foi informado userid no header' };
      } else if (token.sub != id) {
         return { status: 402, message: 'Usuário informado não pertence ao token informado' };
      } else {
         return { status: 200, message: 'Token válido' };
      }
   } catch (e) {
      return { status: 500, message: 'Token inválido' };
   }
};

exports.returnLoginADM = function (dados, exp) {
   try {
      var tokenDados = {
         exp: exp,
         sub: dados.id,
      };
      var serialize = JSON.stringify(tokenDados);
      var token = jwt.encode(serialize, 'owner23');
      return {
         tokenadm: token,
         id: dados.id,
         raz: dados.raz,
         fan: dados.fan,
         cpj: dados.cpj,
         ema: dados.ema,
         domain: dados.domain,

         sysname: dados.sysname,
         logo: dados.logo,
         favicon: dados.favicon,
         corbtnbg: dados.corbtnbg,
         corbtnfg: dados.corbtnfg,
      };
   } catch (e) {
      return null;
   }
};

exports.validTokenADM = function (req) {
   try {
      if (!req.headers.tokenadm || req.headers.tokenadm === 'undefined' || req.headers.tokenadm == '') {
         return { status: 401, message: 'Não foi informado tokenadm' };
      }

      var token = JSON.parse(jwt.decode(req.headers.tokenadm, 'owner23'));
      var now = Date.now();
      var id = req.headers.id;

      if (now > token.exp) {
         return { status: 401, message: 'Código 002 - Token expirado! por favor faça o login novamente.' };
      } else if (id == '') {
         return { status: 401, message: 'Acesso indevido!' };
      } else if (token.sub != id) {
         return { status: 401, message: 'Acesso indevido!' };
      } else {
         return { status: 200, message: 'Token válido' };
      }
   } catch (error) {
      console.error(error);
      return { status: 500, message: 'Token inválido!' };
   }
};

exports.returnTokenMsg = function (autoMsgId, companyId) {
   try {
      var payload = {
         autoMsgId: autoMsgId,
         companyId: companyId,
      };
      var serialize = JSON.stringify(payload);
      var token = jwt.encode(serialize, 'msgToken23');
      return token;
   } catch (e) {
      return '';
   }
};

exports.validTokenMSG = function (req) {
   try {
      if (!req.query.token) {
         return { status: 401, message: 'NOK - Não foi informado token' };
      }
      var tokenDecoded = JSON.parse(jwt.decode(req.query.token, 'msgToken23'));
      req.headers.id = parseInt(tokenDecoded.companyId);
      req.headers.automsgid = parseInt(tokenDecoded.autoMsgId);
      return { status: 200, message: 'Token válido' };
   } catch (error) {
      console.error(error);
      return { status: 500, message: 'NOK - Token inválido!' };
   }
};

exports.returnLoginMASTER = function (dados, exp) {
   try {
      var tokenDados = {
         exp: exp,
         sub: dados.id,
      };
      var serialize = JSON.stringify(tokenDados);
      var secret = 'master23';
      var token = jwt.encode(serialize, secret);
      return {
         tokenmaster: token,
         id: dados.id,
         nam: dados.nam,
         ema: dados.ema,
      };
   } catch (e) {
      return null;
   }
};

exports.validTokenMASTER = function (req) {
   try {
      if (!req.headers.tokenmaster || req.headers.tokenmaster === 'undefined' || req.headers.tokenmaster == '') {
         return { status: 401, message: 'Não foi informado token' };
      }

      var token = JSON.parse(jwt.decode(req.headers.tokenmaster, 'master23'));
      var now = Date.now();
      var id = req.headers.id;

      if (now > token.exp) {
         return { status: 401, message: 'Código 002 - Token expirado! por favor faça o login novamente.' };
      } else if (id == '') {
         return { status: 401, message: 'Acesso indevido!' };
      } else if (token.sub != id) {
         return { status: 401, message: 'Acesso indevido!' };
      } else {
         return { status: 200, message: 'Token válido' };
      }
   } catch (error) {
      console.error(error);
      return { status: 500, message: 'Token inválido!' };
   }
};

exports.returnLoginDEVELOPER = function (dados, exp) {
   try {
      var tokenDados = {
         exp: exp,
         sub: dados.id,
      };
      var serialize = JSON.stringify(tokenDados);
      var secret = 'developer23';
      var token = jwt.encode(serialize, secret);
      return {
         token: token,
         id: dados.id,
         raz: dados.raz,
         ema: dados.ema,
         sysname: dados.sysname,
      };
   } catch (e) {
      return null;
   }
};

exports.validTokenDEVELOPER = function (req) {
   try {
      if (!req.headers.token || req.headers.token === 'undefined' || req.headers.token == '') {
         return { status: 401, message: 'Não foi informado token. Por favor, entre em contato com o administrador.' };
      }
      var token = JSON.parse(jwt.decode(req.headers.token, 'developer23'));
      var now = Date.now();

      if (now > token.exp) {
         return { status: 401, message: 'Token expirado! Por favor, entre em contato com o administrador.' };
      } else {
         req.headers.id = parseInt(token.sub);
         return { status: 200, message: 'Token válido.' };
      }
   } catch (error) {
      console.error(error);
      return { status: 500, message: 'Token inválido. Por favor, entre em contato com o administrador.' };
   }
};

exports.makeTokenForRememberUser = function (company, user, exp) {
   try {
      var tokenDados = {
         "sub": company.id,
         "usr": user.id,
         "exp": exp
      }
      var serialize = JSON.stringify(tokenDados);
      var secret = process.env.SECRET_REMEMBER_USER;
      var token = jwt.encode(serialize, secret);
      return token;
   } catch (e) {
      return "";
   }
};

exports.validTokenForRememberUser = function (token) {
   try {
      if (token == "undefined" || token == "") {
         return { "success": false, "message": "Não foi informado o Token de Acesso para troca de senha", companyId: -1, userId: -1 };
      };
      var token = JSON.parse(jwt.decode(token, process.env.SECRET_REMEMBER_USER));
      var now = Date.now();
      if (now > token.exp) {
         return { "success": false, "message": "Token expirado, solicite novamente a troca de senha ", companyId: -1, userId: -1 };
      } else {
         return { "success": true, "message": "Valid Token", companyId: token.sub, userId: token.usr };
      }
   } catch (e) {
      return { "success": false, "message": "Erro desconhecido ao validar o token, solicite novamente o link para troca de senha", companyId: -1, userId: -1 };
   }
};
