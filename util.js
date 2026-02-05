'use strict';

module.exports = {
  getUrlFromReq,
};

function getUrlFromReq(baseUrl) {
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
