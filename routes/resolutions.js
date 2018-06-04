var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Order = require(libs + 'model/order');

router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {

  var resolution = {
    authorName: req.user.username,
    authorId: req.user._id,
    authorAvatar: req.user.avatarSrc,
    files: req.body.files,
  };

  //TODO user can EDIT || orderId is number

  Order.findOne({id:req.body.orderId}, function(err,order){
    order.resolutions=resolution;
    order.save(function(err) {
      if (!err) {
        log.info("New resolution created on order id: %s", order.id);
        console.log(order);
        return res.json({
          status: 'OK',
          resolution:order.resolutions
        });
      } else {
        if(err.name === 'ValidationError') {
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

router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {

	Resolution.findById(req.params.id, function (err, resolution) {

		if(!resolution) {
			res.statusCode = 404;
			return res.json({
				error: 'Not found'
			});
		}

		if (!err) {
			return res.json({
				status: 'OK',
				resolution:resolution
			});
		} else {
			res.statusCode = 500;
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			return res.json({
				error: 'Server error'
			});
		}
	});
});


module.exports = router;
