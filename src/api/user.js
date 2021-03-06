

const { getUser } = require('../lib/session');
const net = require('net');

function handleUser(req, res, next){
  let user;
  if(req.sessionId){
    user = getUser(req.sessionId, req.params.username);
  }
  if(user){
    if(req.method === 'GET'){
      if(req.path === '/alive'){
        res.end('Y');
      } else if(req.path === '/fs'){
        handleUserDownload(req, res, next);
      } else {
        next();
      }
    } else if(req.method === 'POST'){
      if(req.path === '/unload'){
        user.handlePageUnload(req.sessionId, req.params.username);
        res.end('');
      } else if(req.path === '/upload'){
        handleUserUpload(req, res, next);
      } else {
        next();
      }
    } else {
      next();
    }
    return;
  }
  next({status: 403});
}

function handleUserDownload(req, res, next){
  let filePath = req.query.file;
  if(filePath){
    filePath = decodeURIComponent(filePath);
    normalRequest({
      hash: req.session.hash,
      sid: req.sessionId,
      username: req.params.username,
      method: 'download',
      data: filePath
    }, (err, {data, socket}) => {
      if(err){
        return next(err);
      }
      const etag = stattag(data);
      if(req.get('If-None-Match') === etag){
        res.status(304).end();
        socket.end();
        return;
      }

      res.type('png');
      res.setHeader('Content-Length', data.size);
      res.setHeader('Cache-Control', 'max-age=0');
      res.setHeader('ETag', etag);
      socket.write('go');
      // socket.on('data', function(resData){
      //   console.log('resData', typeof resData, resData.length);
      // })
      socket.pipe(res);
    });
  } else {
    next({
      message: 'not have filePath'
    });
  }
}

function handleUserUpload(req, res, next){
  const filePath = req.body.path;
  normalRequest({
    hash: req.session.hash,
    sid: req.sessionId,
    username: req.params.username,
    method: 'uploadload',
    data: filePath
  }, function(err, {socket}){
    if(err){
      return next(err);
    }
    req.pipe(socket);
    req.on('aborted', () => { 
      //  _console.log('user server aborted');
      socket.destroy();
    });
    socket.once('error', function(err){
      socket.destroy();
      next(err);
    });
    socket.once('close', function(hadError){
      if(hadError){
        next({
          message: 'upload hadError'
        });
        return;
      }
      res.end('ok');
    })
  });
}

const TMP_DIR = global.__TMP_DIR__ + '/linux-remote';

function normalRequest(opt, callback){
  const client = net.createConnection(`${TMP_DIR}/${opt.hash}.${opt.username}`, function(){
    // 不可 setEncoding，否则二进制文件传输不成功。
    client.once('data', function(buffer){
      const data = buffer.toString();
      if(data !== 'ok'){

        callback(new Error(data)); // check sid

      } else {
        client.once('data', function(buffer2){
          let data2 = buffer2.toString();
          try {
            data2 = JSON.parse(data2);
          } catch(e){
            callback(e);
            return;
          }
          if(data2.status !== 'success'){
            callback(new Error(data2.message || 'unknown err'));
          } else {
            callback(null, {
              socket: client,
              data: data2.data
            });
          }
        });
        client.write(opt.data);
      }
    })
    client.write(opt.sid + ' ' + opt.method);
  })
}
// router.post('/upload', function(req, res){
//   res.end('ok');
// });
// router.post('/upload', function(req, res){
//   res.end('ok');
// });

// ws...

// ------------------------- npm module etag -------------------------
// copyright https://github.com/jshttp/etag MIT License
// modifed: mtime is geted. add W/
/**
 * Generate a tag for a stat.
 *
 * @param {object} stat
 * @return {string}
 * @private
 */

function stattag (statObj) {
  var mtime = statObj.mtime.toString(16);
  var size = statObj.size.toString(16);
  return 'W/"' + size + '-' + mtime + '"'
}
// ------------------------- npm module etag end -------------------------

module.exports = handleUser;
