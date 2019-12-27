
const { ptyExec } = require('./pty-exec');

const util = require('../common/util');
const { FLAG } = require('./util');

// const start = new EventEmitter();
const APP_PATH = global.CONF.userServerMain;

function startUserServer(username, password, mainSid, callback) {
  
  const tmpName = util.getTmpName(mainSid, username);
  const PORT = `${tmpName}.sock`;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const cmd = `NODE_ENV=${NODE_ENV} PORT=${PORT} ${process.argv[0]} ${APP_PATH}`;

  ptyExec(username, password, cmd, function(data){
    if(data.indexOf(FLAG) !== -1) {
      callback(null, data);
    } else {
      callback(true);
    }
  })
}

module.exports = startUserServer;