"use strict";
const os = require('os');
const fs = require('fs');
const path = require('path');
const { initSecure } = require('./lib/secure');

let isPro = process.env.NODE_ENV === 'production';

let homeDir = os.userInfo().homedir;
let tmpDir,
    clientVersion, 
    confPath,
    conf;

if(isPro){
  tmpDir = os.tmpdir();
  clientVersion = _getClientVersion();
  confPath = path.join(homeDir, 'config.js');
}else {
  tmpDir = '/dev/shm'; // Protect my disk
  clientVersion = 'dev';
  confPath = path.join(__dirname, '../dev.config.js');
}

if(!clientVersion){
  process.send({type: 'exit', data: 'Not has clientVersion.'});
  return;
}
global.__HOME_DIR__ = homeDir;
global.IS_PRO = isPro;
global.__TMP_DIR__ = tmpDir;
global.__CLIENT_VERSION__ = clientVersion;
conf = global.CONF = require(confPath);

if(conf.appTrustProxy === true){
  process.send({
    type: 'exit', 
    data: "can't set appTrustProxy true."
  });
  return;
}

if(conf.secure){
  let errMsg = initSecure(conf.secure);
  if(errMsg){
    process.send({
      type: 'exit',
      data: errMsg
    });
    return;
  }
}

conf.CORS = typeof conf.client === 'string' ? conf.client : null;

_def(conf, 'appTrustProxy', false);
_def(conf, 'cookie', Object.create(null));


function _getClientVersion(){
  let versionMap = fs.readFileSync(path.join(homeDir , '/.version-map.json'), 'utf-8');
  versionMap = JSON.parse(versionMap);
  let clientVersion = versionMap['_client'] || versionMap['client'];
  versionMap = null;
  return clientVersion;
}

function _def(obj, key, value){
  if(obj[key] === undefined){
    obj[key] = value;
  }
}

isPro = null;
tmpDir = null;
clientVersion = null;
homeDir = null;
confPath = null;
conf = null;