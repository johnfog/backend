var libs = process.cwd() + '/libs/';
var rest = require(libs + 'rest');
var http = require("http").createServer(rest);

var config = require(libs + 'config');
var io = require('socket.io')(http);
var Message = require(libs + 'model/message');
var Order = require(libs + 'model/order');
var User = require(libs + 'model/user');
var Request = require(libs + 'model/request');
var Balance = require(libs + 'model/balance');
var AccessToken = require(libs + 'model/accessToken');
var sockets = {};

http.listen(8088, "172.23.200.29");

io.on('connection', (socket) => {
  socket.auth = false;
  console.log('user connected ' + socket.id);
  socket.emit('noauth', 'AUTHFALSE');
  socket.on('disconnect', function() {
    if (sockets[socket.userid] != null) {
      delete sockets[socket.userid];
    }
    console.log('user disconnected: ' + socket.username);
  });

  socket.on('authenticate', function(accessToken) {
    AccessToken.findOne({
      token: accessToken
    }, function(err, token) {

      if (err) {
        console.log('123' + err);
        socket.emit(err);
        return null;
      }

      if (!token) {
        console.log(err);
        socket.emit(err);
        return null;
      }

      if (Math.round((Date.now() - token.created) / 1000) > config.get('security:tokenLife')) {

        AccessToken.remove({
          token: accessToken
        }, function(err) {
          if (err) {
            socket.emit(err);
            return null;
          }
        });
        socket.emit('Token Expired');
        return null;
      }

      User.findById(token.userId, function(err, user) {

        if (err) {
          socket.emit(err);
        }

        if (!user) {
          socket.emit('Unknown Error');
          return null;
        }
        socket.auth = true;
        socket.userid = user._id;
        socket.username = user.username;
        socket.phone = user.phone;
        socket.avatarSrc = user.avatarSrc;
        console.log('connection authenticate ' + socket.username);
        socket.emit('authenticate', 'AUTHOK');
        sockets[user._id] = socket;
      });
    });
  });
  
  socket.on('cancel-request', (params) => {
    Request.findOne({
		orderId: params.id,
		authorId: socket.userid,
		status: "open"
	},function(err,request)
		{
			request.status="canceled";
			request.save();
			Order.findOne({
				id: params.id
				}, function(err, order) {
					console.log(request);
			sockets[order.authorId].emit('cancel-request',socket.userid);
			});
		});
	});

  socket.on('add-request', (request) => {
    var newRequest = Request({
      orderId: request.id,
      created: Date().now,
      authorName: socket.username,
      authorId: socket.userid,
      authorAvatar: socket.avatarSrc,
      price: request.price,
	  status: "open"
    })

    newRequest.save(function(err) {
      if (!err) {
        Order.findOne({
          id: request.id
        }, function(err, order) {
			  socket.broadcast.emit('request', {
			  id: newRequest._id,
              price: newRequest.price,
              authorId: newRequest.authorId,
              authorName: newRequest.authorName,
              authorAvatar: newRequest.authorAvatar          
        });
			
		/*if (sockets[order.authorId]) {
            sockets[order.authorId].emit('request', {
              id: newRequest._id,
              price: newRequest.price,
              authorId: newRequest.authorId,
              authorName: newRequest.authorName,
              authorAvatar: newRequest.authorAvatar,
            });
        } */
        });
      } else {
        if (err.name === 'ValidationError') {
          console.log(err);
          io.emit('message', 'Validation ERROR');
        } else {
          io.emit('message', 'Server ERROR');
        }
      }
    });
  });

  socket.on('accept-request', (params) => {
    Order.findOne({
      id: params.id
    }, function(err, order) {
      User.findOne(({
        _id: params.userId
      }), function(err2, user) {
        order.executorName = user.username;
        order.executorId = user._id;
        order.executorAvatar = user.avatarSrc;
		order.status = "assigned";
        Balance.findOne({
          userid: socket.userid
        }, function(err, balance) {
          if (balance)
			  console.log(params);
            Request.findOne({
              _id: params.requestId,
			  status: "open"
            }, function(err, request) {
              if (request) {
                if (balance.value < request.price) {
                  return socket.emit('get-state-request-answer', JSON.stringify({
                    status: "nomoney"
                  }));
                }
              }
              order.save(function(err3) {
                if (!err3) {
                  if (!balance.blocked || balance.blocked == "undefined") {
                    balance.blocked = 0;
                  }
                  balance.value -= parseInt(request.price);
                  balance.blocked += parseInt(request.price);
                  balance.save(function(err) {
                    if (!err) {
                      socket.emit('get-state-request-answer', JSON.stringify({
                        status: "assigned",
                        username: user.username
                      }));
                      if (sockets[params.userId]) {
                        sockets[params.userId].emit('accept-request', {
                          status: 'accepted',
                        });
                      }
                    } else {
                      if (err.name === 'ValidationError') {
                        console.log(err);
                        io.emit('message', 'Validation ERROR');
                      } else {
                        io.emit('message', 'Server ERROR');
                      }
                    }
                  });


                } else {
                  if (err3.name === 'ValidationError') {
                    console.log(err3);
                    io.emit('message', 'Validation ERROR');
                  } else {
                    io.emit('message', 'Server ERROR');
                  }
                }
              });
            });
        });
      });
    });
  });

  socket.on('add-message', (message) => {
    var newMessage = Message({
      sentAt: Date().now,
      authorId: socket.userid,
      text: message.text,
      room: message.room,
    });

    newMessage.save(function(err) {
      if (!err) {
        socket.broadcast.emit('message', {
          username: socket.username,
          sentAt: newMessage.sentAt,
          authorId: newMessage.authorId,
          avatarSrc: socket.avatarSrc,
          text: newMessage.text,
          room: newMessage.room
        });
      } else {
        if (err.name === 'ValidationError') {
          console.log(err);
          io.emit('message', 'Validation ERROR');
        } else {
          io.emit('message', 'Server ERROR');
        }
      }
    });

  });

  socket.on('add-dialog-message', (message) => {
    var newMessage = Message({
      sentAt: Date().now,
      username: socket.username,
      authorId: socket.userid,
      avatarSrc: socket.avatarSrc,
      text: message.text,
      room: "user_" + message.dialogUserId,
    });

    newMessage.save(function(err) {
      if (!err) {
        if (sockets[message.dialogUserId]) {
          sockets[message.dialogUserId].emit('message', {
            username: socket.username,
            sentAt: newMessage.sentAt,
            authorId: newMessage.authorId,
            avatarSrc: socket.avatarSrc,
            text: newMessage.text,
            room: newMessage.room
          });
        }
      } else {
        if (err.name === 'ValidationError') {
          console.log(err);
          io.emit('message', 'Validation ERROR');
        } else {
          io.emit('message', 'Server ERROR');
        }
      }
    });

  });
});

module.exports = rest;
