var express = require('express');
var router = express.Router();
var ym = require('yandex-money-sdk');
var async = require('async');
var util = require('util');
var url = require('url');
var passport = require('passport');
var morgan = require("morgan");
var libs = process.cwd() + '/libs/';
var config = require(process.cwd() + '/libs/' + 'config');
var utils = require('../utils');
var log = require(libs + 'log')(module);

var Balance = require(libs + 'model/balance');
var Payments = require(libs + 'model/payments');

var URL = {
  success: "/api/yandex/process-external-success/",
    fail: "/api/yandex/process-external-fail/"
};

router.post("/",passport.authenticate('bearer', {
  session: false
  }), function (req, res, next) {
 var request;
 var instance;	  
 var userid = req.user._id;
 console.log(userid);
 var wallet = "410014535579741";
 var number=parseInt(req.body.value);
 if (!isNaN(number))
 {
    var value = number;
 }else
 {
    res.status(500).send({error:"Validation Error"});
    return;
 }

  var context = {
  };
 
  async.waterfall([
    function getInstanceId(callback) {
      ym.ExternalPayment.getInstanceId(
        config.get("yandex:CLIENT_ID"), callback);
    },
    function getRequestId(data, r, callback) {
      if(data.status !== "success") {
        callback(data);
        return;
      }
	  
	  var res_instance=JSON.stringify(data, undefined, 2);
	  instance = data.instance_id;
	  console.log("INSTANCE");
	  console.log(data);
	  
      context.api = new ym.ExternalPayment(data.instance_id);
      var options = {
        pattern_id: "p2p",
        to: wallet,
        amount_due: value,
        comment: "sample test payment",
        message: "USERID - "+userid
      };
      context.api.request(options, callback);
    },
    function getAuthUrl(data, r, callback) {
      if(data.status !== "success") {
        callback(data);
        return;
      }
	  request_payment=JSON.stringify(data, undefined, 2);
	  
	  
	  request = data.request_id;
	  console.log("DATA");
	  console.log(JSON.stringify(data, undefined, 2));	  
      var success_url = util.format(
        "http://%s%s", req.headers.host, URL.success);
      var fail_url = util.format(
        "http://%s%s", req.headers.host, URL.fail);
      var options = {
        request_id: data.request_id,
        ext_auth_success_uri: success_url,
        ext_auth_fail_uri: fail_url
      };
      context.api.process(options, callback);
    },
    function makeRedirect(data, r, callback) {
      if(data.status !== "ext_auth_required") {
        callback(data);
        return;
      }
	  payment1=JSON.stringify(data, undefined, 2);
	  
	  var newPayment = Payments({
	  	userid: userid,
		request_id: request,
		instance_id: instance,
		status: 'created',
		value: value
	   });
	   
	  newPayment.save(function(err) {
    if (!err) {
      log.info("New payment created with id: %s", newPayment.id);
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

	  
      res.send(url.format({
        query: data.acs_params
      }));
    }
  ], function complete(err) {
    if(err) {
      next({
        home: "../../",
        err: err
      });
    }
  });
});

router.get("/process-external-success/", function (req, res, next) {
	
	var request = req.query.cps_context_id;
	var context = {};
	Payments.findOne({
				 request_id: request,
				 status: "created"
              }, function(err, payment) {
				  if (!payment){
					  console.log("Can't find payment with order "+request);
					  return res.send("PAYMENT ERROR");
				  }
		
	context = {
		request_id: request,
		instance_id: payment.instance_id,
		process_response: null,
		process_payment2: null
	};	
  
  var success_url = util.format(
    "http://%s%s", req.headers.host, URL.success);
  var fail_url = util.format(
    "http://%s%s", req.headers.host, URL.fail);
	
	console.log("CONTEXT");
	console.log(context);
	
  if(!context.request_id || !context.instance_id) {
    next({
      err: "Cookie is expired or incorrect",
      home: "../"
    });
    return;
  }
  context.api = new ym.ExternalPayment(context.instance_id);

  async.whilst(function (data, r) {
    if(context.process_response === null) {
      return true;
    }
    return context.process_response.status === "in_progress";	
  },
  function checkStatus(callback) {
    context.api.process({
      request_id: context.request_id,
      ext_auth_success_uri: success_url,
      ext_auth_fail_uri: fail_url
    }, function(err, data) {
      context.process_response = data;
		 if (data.status=="success"){
			 Balance.findOneAndUpdate({"userid": payment.userid},{ $inc: { value: payment.value }},function(err,balance){
				  if(err){
					console.log("Something wrong when updating data!");
				   }
				payment.status="done";
				payment.save(function(err) {
	if (err)
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
  });
			 });
		 }
      callback();
    });
  },
  function complete(err) {
    res.redirect('http://www.buydz.ru/member/balance');
  });
});

});

router.get("/process-external-fail/", function (req, res, next) {
	
    res.send("Ошибка при зачислении денежных средств");
  
  
});


module.exports = router;
