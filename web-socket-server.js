const WebSocket = require('ws');
const url = require('url');
const sessMiddleware = require('./lib/sess-middleware');
//const {getClientIp} = require('./common/util');

// const MAX_AGE = 1000 * 60 * 15;

module.exports = function(server){
  const webSocketServer = new WebSocket.Server({
    verifyClient(info, done){
      const req = info.req;
      if(!req.headers.cookie){
        // need touch server first!
        return done(false);
      }
      sessMiddleware(req, {}, () =>{
        const loginedMap = req.session.loginedMap || Object.create(null);
        const location = url.parse(req.url, true);
        if(!loginedMap[location.query.user]){
          done(false);
        }else{
          done(true);
        }
      });
    },
    server });

  // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
  function noop() {}

  function heartbeat() {
    this.isAlive = true;
  }

  var isChecked = false;
  
  function checkLive(){

    if(isChecked) {
      return;
    }
    isChecked = true;

    function loop(){
      setTimeout(function(){
        webSocketServer.clients.forEach(function each(ws) {
          if (ws.isAlive === false){
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping(noop);
        });
        if(webSocketServer.clients.size){
          loop();
        }else{
          isChecked = false;
        }
      }, 30000); // 30 秒 执行一次
    }
    loop();
  }


  function send(ws, data){
    if(ws.readyState === WebSocket.OPEN){
      ws.send(JSON.stringify(data));
    }
  }
  function broadcast(data){
    webSocketServer.clients.forEach((client) => {
      send(client, data);
    })
  }

  function sendOther(ws, otherData){
    webSocketServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        var data = {
          name: ws.username,
          id: ws.id,
          isMe: ws === client
        }
        send(client, Object.assign(data, otherData))
      }
    })
  }
  
  function getList(){
    const list = [];
    webSocketServer.clients.forEach(client => {
      if(client.readyState === WebSocket.OPEN ){
        list.push({
          name: client.username,
          id: client.id
        });
      }
    });
    return list;
  }

  var index = 0;

  webSocketServer.on('connection', function connection(ws, req) {
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    checkLive();



    const location = url.parse(req.url, true);
    ws.id = index;
    index = index + 1;
    ws.username = location.query.user;

    //ws.ip = getClientIp(req);

    // const data = {
    //   type: 'userLogin',
    //   name: ws.username,
    //   total: webSocketServer.clients.size
    // }

    ws.on('message', function(message){
      sendOther(ws, {
        type: 'say',
        msg: message
      });
    })

    

    // webSocketServer.clients.forEach(client => {
    //   list.push({
    //     name: client.username,
    //     ip: client.ip
    //   });
    //   if(client.readyState !== WebSocket.OPEN && client._expire < Date.now()){
    //     client.close();
    //     console.log('ws 客户端过期了。');
    //   }
    // });
    broadcast({
      list: getList()
    });

    send(ws, {
      id: ws.id,
      name: ws.username
    });

    ws.on('close', function(){
      // broadcast({
      //   list: getList()
      // });
    })
    ws.on('error', function(e){	
      ws.close();
      console.log('ws error2', e);
    });
    // send(ws, {
    //   type: 'init',
    //   list
    // })

  });
  return webSocketServer;
};
