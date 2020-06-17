const WebSocket = require('ws');
const { initSession, initSessUser } = require('./lib/session');
const userWsNsPipe = require('./lib/user-ws-ns-pipe.js');
const ipcSay = require('./lib/ipc-say.js');
const wsWaitTimerout = 5000;



const wsServer = new WebSocket.Server({ noServer: true, perMessageDeflate: false });
const URL_PREFIX = global.__API_PATH__ + '/user/';
// url: ws://127.0.0.1:3000/api/user/:username
function getUsername(url){
  if(url.indexOf(URL_PREFIX) === 0){
    return url.substr(URL_PREFIX.length);
  }
  return '';
}

function handleServerUpgrade(req, socket, head) {
  const username = getUsername(req.url);
  if(!username){
    socket.destroy();
    return;
  }
  _wsInitSessUser(req, username, function(user){
    if(!user){
      socket.destroy();
      return;
    }
    const sid = req.sessionId;
    wsServer.handleUpgrade(req, socket, head, function done(ws) {
      user.ws = ws;
      if(user.ns && !user.ns.destroyed){
        userWsNsPipe(user);
      } else {
        ipcSay({type: 'startUser', data: {sid, username}});
        user.wsWaitTimer = setTimeout(function(){
          ws.close(1011, 'wait ns timerout.');
          user.wsWaitTimer = null;
        }, wsWaitTimerout);
      }
    });
  })
}

function _wsInitSessUser(req, username, callback){
  initSession(req, function(){
    callback(initSessUser(req, username));
  });
}

module.exports = function wsServer(server){
  server.on('upgrade', handleServerUpgrade);
};

