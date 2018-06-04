var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var config = require(libs + 'config');

var db = require(libs + 'db/mongoose');
var Order = require(libs + 'model/order');
var Request = require(libs + 'model/request');
var Message = require(libs + 'model/message');

var needsGroup = function(group) {
  return function(req, res, next) {
    if (req.user && req.user.group === group)
      next();
    else
      res.send(401, 'Unauthorized');
  };
};

router.get('/', passport.authenticate('bearer', {
  session: false
}), needsGroup('admin'), function(req, res, next) {


  Order.find({status: "active"},function(err, orders) {
    if (!err) {
      return res.json(orders);
    } else {
      res.statusCode = 500;

      log.error('Internal error(%d): %s', res.statusCode, err.message);

      return res.json({
        error: 'Server error'
      });
    }
  }).sort({
    _id: -1
  });
});

router.post('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {

  var newOrder = Order({
    authorName: req.user.username,
    authorId: req.user._id,
    authorAvatar: req.user.avatarSrc,
    subject: req.body.subject,
    type: req.body.type,
    description: req.body.description,
    date: req.body.date,
    price: req.body.price,
    files: req.body.files,
	status: "active"
  });

  newOrder.save(function(err) {
    if (!err) {
      log.info("New order created with id: %s", newOrder.id);
      return res.json({
        id: newOrder.id
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

router.get('/:id', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {
  var context = {
  };

  Order.findOne({
    id: req.params.id
  }, function(err, order) {

    if (!order) {
      res.statusCode = 404;
      return res.json({
        error: 'Not found'
      });
    }

    if (!err) {
      Request.find({
        orderId: req.params.id,
		status: "open"
      }, function(err2, requests) {
        Message.find({
          room: "order_" + req.params.id
        }, function(err, messages) {
          if (requests[0]) {
            for (var i = 0; i < requests.length; i++) {
              if (requests[i].authorId == req.user._id) {
                context = {
                  status: 'offered',
                  price: requests[i].price
                };
              } else {
                context = {
                  status: 'none',
                  data: requests
                }
              }
            }
          }
          if ((order.executorId != 'undefined') && (order.executorId == req.user._id)) {
            context = {
              status: 'assigned',
            }
          }

          return res.json({
            order: order,
            messages: messages,
            requests: context
          });


        }).limit(config.get("const:messages_limit")).sort({
          sentAt: -1
        }).populate('authorId');


      }).sort({
		_id: -1
	});
    } else {
      res.statusCode = 500;
      return res.json({
        error: 'Server Error'
      });
    }
  });
});


module.exports = router;
