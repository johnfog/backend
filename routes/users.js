var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';

var log = require(libs + 'log')(module);
var db = require(libs + 'db/mongoose');
var User = require(libs + 'model/user');
var Balance = require(libs + 'model/balance');

router.post('/', function(req, res , next) {
  var newUser = User({
    username: req.body.username,
    phone: req.body.phone,
    group: 'user',
    password: req.body.password,
    avatarSrc: "/assets/images/users/3.jpg"
  });

  newUser.save(function(err) {
    if (!err) {
      log.info("New user created with id: %s", newUser.id);
	  
	  var balance = new Balance({
			userid: newUser.id,
			value: 0
		});
		balance.save(function(err, user) {
			if(err) {
				console.log(err);
			}
		});
	  
      return res.json({
        status: 'OK'
      });
    } else {
      if (err.name === 'ValidationError') {
        console.log(err);
        res.statusCode = 400;
        res.json({
          error: 'Validation error'
        });
      } else {
        res.statusCode = 500;

        log.error('Internal error(%d): %s', res.statusCode, err.message);

        res.json({
          error: 'Server error'
        });
      }
    }
  });
});

router.get('/',passport.authenticate('bearer', {
  session: false
}),  function(req, res, next) {
	if (!req.user){
		res.statusCode = 401;
      log.error('Authorization error(%d)', res.statusCode);
      return res.json({
        error: 'Authorization error'
      });
	}
	username = req.user.username;	
  User.findOne({username:username},function(err, user) {
    if (!err) {
		var context = {
			username   : user.username,
			avatarSrc   : user.avatarSrc,
			//phone      : user.phone,
			lastonline : user.lastonline,
			profession : user.profession,
			city	   : user.city,
			rating	   : user.rating,
			birthday   : user.birthday,
			created   : user.created
		};
		
      return res.json(context);
    } else {
      res.statusCode = 500;

      log.error('Internal error(%d): %s', res.statusCode, err.message);

      return res.json({
        error: 'Server error'
      });
    }
  });
});


router.get('/:username',passport.authenticate('bearer', {
  session: false
}),  function(req, res, next) {
	if (!req.user){
		res.statusCode = 401;
      log.error('Authorization error(%d)', res.statusCode);
      return res.json({
        error: 'Authorization error'
      });
	}
	if (!req.params.username){
	  res.statusCode = 403;
      log.error('Validation error(%d) username', res.statusCode);
      return res.json({
        error: 'Validation error'
      });
		
	}
	username = req.params.username;	
  User.findOne({username:username},function(err, user) {
    if (!err) {
		var context = {
			username   : user.username,
			avatarSrc   : user.avatarSrc,
			//phone      : user.phone,
			lastonline : user.lastonline,
			profession : user.profession,
			city	   : user.city,
			rating	   : user.rating,
			birthday   : user.birthday,
			created   : user.created
		};
		
      return res.json(context);
    } else {
      res.statusCode = 500;

      log.error('Internal error(%d): %s', res.statusCode, err.message);

      return res.json({
        error: 'Server error'
      });
    }
  });
});

router.put('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
	User.findOne({_id : req.user._id},function(err,user){
	if (!req.user){
		res.statusCode = 401;
      log.error('Authorization error(%d)', res.statusCode);
      return res.json({
        error: 'Authorization error'
      });
	}		
		user.profession = req.body.profession;
		user.city 		= req.body.city;
		user.phone 		= req.body.phone;
		//user.avatarSrc 	= req.body.avatarSrc;
		user.birthday  	= req.body.birthday;
		
	  user.save(function(err) {
    if (!err) {
      log.info("User updated with id: %s", user.id);	  
      return res.json({
        status: 'OK'
      });
    } else {
      if (err.name === 'ValidationError') {
        console.log(err);
        res.statusCode = 400;
        res.json({
          error: 'Validation error'
        });
      } else {
        res.statusCode = 500;
        log.error('Internal error(%d): %s', res.statusCode, err.message);
        res.json({
          error: 'Server error'
        });
      }
    }
  });
	});
	
	
	
});


module.exports = router;
