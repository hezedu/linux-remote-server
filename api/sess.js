// get
exports.touch = function(req, res){
  res.json({
    loginedMap : req.session.loginedMap || Object.create(null)
  });
}

// get
exports.verifyLogined = function(req, res, next){
  if(!req.session.loginedMap || Object.keys(req.session.loginedMap).length === 0){
    res.status(403).send('forbidden!');
  } else {
    next();
  }
}
