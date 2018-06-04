var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Balance = require(libs + 'model/balance');
var Payments = require(libs + 'model/payments');

router.get('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
	var context = {};

  Balance.findOne({userid:req.user._id},function(err, balance) {
    if (!err) {
		var data = [];
		Payments.find({userid:req.user._id}, function(err,payments){
		payments.forEach(function(payment) {
		data.push({
			name: "Пополнение баланса",
			created: payment.created,
			status: payment.status,
			value: payment.value
		});
		
		});		
		 context = {
		  available: balance.value,
		  blocked: balance.blocked,
		  payments: data
	  }
	  return res.json(context);
	
	});      
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
