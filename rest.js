var express = require('express');
var path = require('path');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var methodOverride = require('method-override');
var multer = require('multer');
var morgan = require("morgan");
var session = require('express-session');
var sizeOf = require('image-size');

var libs = process.cwd() + '/libs/';
require(libs + 'auth/auth');

var config = require('./config');
var log = require('./log')(module);
var oauth2 = require('./auth/oauth2');

var api = require('./routes/api');
var yandex = require('./routes/yandex');
var balance = require('./routes/balance');
var users = require('./routes/users');
var orders = require('./routes/orders');
var resolutions = require('./routes/resolutions');
var myorders = require('./routes/myorders');
var subjects = require('./routes/subjects');
var contacts = require('./routes/contacts');
var messages = require('./routes/messages');

var rest = express();

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

rest.use(cors(corsOptions));

rest.use(bodyParser.json());
rest.use(bodyParser.urlencoded({
  extended: false
}));
rest.use(session({secret: "super secret key", resave: true, saveUninitialized: true}));
rest.use(morgan('dev'));
rest.use(cookieParser());
rest.use(methodOverride());
rest.use(passport.initialize());

rest.use('/', api);
rest.use('/api', api);
rest.use('/api/users', users);
rest.use('/api/orders', orders);
rest.use('/api/yandex', yandex);
rest.use('/api/balance', balance);
rest.use('/api/resolutions', resolutions);
rest.use('/api/myorders', myorders);
rest.use('/api/subjects', subjects);
rest.use('/api/contacts', contacts);
rest.use('/api/messages', messages);
rest.use('/api/oauth/token', oauth2.token);

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, './uploads');
  },
  filename: function(req, file, callback) {
    callback(null, 'img-' + Date.now() + file.originalname);
  }
});
var upload = multer({
  storage: storage
}).single('file');

rest.post('/file-upload', function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      console.log(err);
      return res.end("Error uploading file.");
    }
    res.status = 200;
    res.end(JSON.stringify(req.file));
  });
});

rest.get('/uploads/:filename', function(req, res) {
  res.sendFile(path.join(__dirname, '../uploads/' + req.params.filename));
});


// catch 404 and forward to error handler
rest.use(function(req, res, next) {
  res.status(404);
  log.debug('%s %d %s', req.method, res.statusCode, req.url);
  res.json({
    error: 'Not found'
  });
  return;
});

// error handlers
rest.use(function(err, req, res, next) {
  res.status(err.status || 500);
  log.error('%s %d %s', req.method, res.statusCode, err.message);
  res.json({
    error: err.message
  });
  return;
});

module.exports = rest;
