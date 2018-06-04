var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Contact = require(libs + 'model/contact');
var Users = require(libs + 'model/user');

router.get('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {

  Contact.findOne({userid: req.user._id},function(err, contacts) {
    if (!err) {
      return res.json(contacts);
    } else {
      res.statusCode = 500;
      log.error('Internal error(%d): %s', res.statusCode, err.message);
      return res.json({
        error: 'Server error'
      });
    }
  });
});

router.get('/:searchString', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
  var context = [];
  
  console.log(req.params.searchString.length);
  
  if ((req.params.searchString.length < 3) || (req.params.searchString.length > 15))
  {
	  res.statusCode = 500;
      log.error('Validation error (%d)', res.statusCode);
	  
      return res.json({
        error: 'Server error'
      });
  }
  
  Users.find({
    username: req.params.searchString
  }, function(err, users) {
	  if (!users) {
      res.statusCode = 404;
      return res.json({
        error: 'Not found'
      });
    }
	
	if (!err) {
		for (var i=0;i<users.length;i++)
		{
			context.push(
			{
				username : users[i].username,
				avatarSrc : users[i].avatarSrc,
				userid: users[i]._id,
			}
			);
		}
	return res.json({
		contacts:context
	});
		
	}else{
		res.statusCode = 500;
		return res.json({
        error: 'Validation Error'
      });
		
	}
	  
  
  }).limit(10);
});

router.post('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
	var context = {
			userid:req.body.userid,
			username: req.body.username,
			avatarSrc: req.body.avatarSrc
	};
	Contact.findOneAndUpdate({userid: req.user._id}, {$push: {
		"contacts": context
	}},function(err, data) {
		if (!data){
			var contact = Contact({
				userid: req.user._id,
				contacts: context
			});
			
			contact.save();
		}
    if (!err) {
      return res.json(data);
    } else {
      res.statusCode = 500;

      log.error('Internal error(%d): %s', res.statusCode, err.message);

      return res.json({
        error: 'Server error'
      });
    }
  });
  
  
});



module.exports = router;
