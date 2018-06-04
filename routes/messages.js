var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Message = require(libs + 'model/message');

router.get('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {

  Contact.find({userid: req.user._id},function(err, contacts) {
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

router.get('/:chatUserId', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
  var context = [];
  Message.find({$or: [{authorId:req.user._id,room:"user_"+req.params.chatUserId},{authorId:req.params.chatUserId,room:"user_"+req.user._id}]}, function(err, messages) {
	  if (!messages) {
      res.statusCode = 404;
      return res.json({
        error: 'Not found'
      });
    }
	
	if (!err) {
	return res.json({
		messages:messages
	});
		
	}else{
		res.statusCode = 500;
		return res.json({
        error: 'Server Error'
      });
		
	}
	  
  
  }).limit(30);
});

module.exports = router;
