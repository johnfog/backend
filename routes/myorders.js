var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Order = require(libs + 'model/order');
var id;

router.get('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
  Order.find({authorId:req.user._id},function(err, orders) {
    if (!err) {
      return res.json(orders);
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
