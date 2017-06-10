

//var PRE_EXIT_CODE = process.env.PRE_EXIT_CODE || ''
// function loop(){
//   let processCode = 0;
//   const ls = spawn(process.argv[0], [process.mainModule.filename], {
//     detached: true,
//     env: {
//       PRE_EXIT_CODE,
//       IS_WATCHER: true,
//       NODE_ENV: process.env.NODE_ENV,
//       PORT: process.env.PORT  || 3001
//     }
//     //,stdio: 'inherit'
//   });
//
//   ls.stdout.on('data', (data) => {
//     console.log(`stdout: ${data}`);
//   });
//
//   ls.stderr.on('data', (data) => {
//     console.log(`stderr: ${data}`);
//   });
//
//   ls.on('close', (code) => {
//     //fs.writeFileSync(path.join(__dirname ,'code.txt'), code);
//     if(code !== 0){
//       console.log(`exited code loop!`, arguments);
//       loop();
//     }else{
//       console.log(`child exit success!`);
//     }
//   });
// }
//
//
// if(!process.env.IS_WATCHER){
//   return loop();
// }
const fs = require('fs');
const PORT = process.env.PORT;
fs.unlinkSync(PORT);

const {execSync, spawn} = require('child_process');
const path = require('path');

const {onListening, onError, normalizePort} = require('./common/server-util');

const NODE_ENV = process.env.NODE_ENV || 'development';
global.IS_PRO = NODE_ENV === 'production';

var express = require('express');
var logger = require('morgan');
// var session = require('express-session');
// var cookieParser = require('cookie-parser');
// var sessStore = require('./lib/fs-session-store')(session);


var app = express();
app.use(logger(global.IS_PRO ? 'tiny' : 'dev'));

// app.use(cookieParser());

app.get('/', function(req, res, next){
  var msg = 'Hello! this is linux-remote user server!\n listen on ' + PORT + '\n';
  msg += 'pid: ' + process.pid;
  res.send(msg);
});

app.get('/exit', function(req, res, next){
  res.send('exit:' + PRE_EXIT_CODE);
  res.on('finish', function(){
    process.exit();
  });
});


var server = http.createServer(app);
server.listen(PORT);

server.on('listening', onListening(server, function(){
  console.log('更改权限到600: ' + PORT);
  execSync('chmod 600 ' + PORT);
}));

server.on('error', onError);




// app.get('/exit', function(req, res, next){
//   res.send('exit', null, function(){
//     console.log('exit');
//
//     //process.exit(1);
//   });
// });

// app.use('/api/user/:userName', session({
//     secret: global.CONF.sessionSecret,
//     name: 'user_sid',
//     cookie: {
//         baseUrlField: true,
//         httpOnly: true
//     },
//     store: new sessStore({
//       dir: path.resolve(__dirname, 'data/session')
//     }),
//     resave: true,
//     saveUninitialized: true
// }));



// app.get('/api/user/:userName', function(req, res, next){
//   var msg = '当前用户:' + req.params.userName;
//   var cookie = req.cookies;
//   msg += '\ncookie: ' + JSON.stringify(cookie);
//   msg += '\nsession' + JSON.stringify(req.session);
//   res.send(msg);
// });