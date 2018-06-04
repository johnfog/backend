var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Subjects = require(libs + 'model/subjects');

router.get('/', passport.authenticate('bearer', {
  session: false
}), function(req, res, next) {

  Subjects.find(function(err, subjects) {
    if (!err) {
      return res.json(subjects);
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
