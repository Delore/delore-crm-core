const ret = require('./ret.js');

exports.validaRequestSystem = async function (req, res, next) {
   var token = await ret.validToken(req);
   if (token.status == 200) {
      next();
   } else {
      res.status(token.status).json({ msg: token.message });
      return false;
   }
};

exports.validaRequestADM = function (req, res, next) {
   var token = ret.validTokenADM(req);
   if (token.status == 200) {
      next();
   } else {
      res.status(token.status).json({ msg: token.message });
      return false;
   }
};

exports.validaRequestMASTER = function (req, res, next) {
   var token = ret.validTokenMASTER(req);
   if (token.status == 200) {
      next();
   } else {
      res.status(token.status).json({ msg: token.message });
      return false;
   }
};

exports.validaRequestMSG = function (req, res, next) {
   var token = ret.validTokenMSG(req);
   if (token.status == 200) {
      next();
   } else {
      res.status(token.status).send(token.message);
      return false;
   }
};

exports.validaRequestDEVELOPER = function (req, res, next) {
   var token = ret.validTokenDEVELOPER(req);
   if (token.status == 200) {
      next();
   } else {
      res.status(token.status).send(token.message);
      return false;
   }
};
