const http = require('http');
const https = require('https');

const conf = global.CONF;

const app = require('./app');

let server;
if(conf.secure){
  server = https.createServer(conf.secure, app);
}else{
  server = http.createServer(app);
}

server.listen(conf.port);

server.on('listening', function(){
  console.info('server_main start');
  console.info('listening on ' + conf.port);
  console.info('NODE_ENV ' + process.env.NODE_ENV);
  process.send({type: 'serverListened'});
});

server.on('error', function(err){
  let errMsg;
  if (err.code === 'EADDRINUSE') {
    errMsg = 'port ' + conf.port + ' is already in use.';
  } else {
    errMsg = err.name + ': ' + err.message;
  }
  console.error(errMsg);
});

const wsServer = require('./ws-server.js');

wsServer(server);

