// Load required packages
var mongoose = require('mongoose');
var Subjects = require('../model/subjects');
var Counter = require('../model/counter');
var Schema = mongoose.Schema;

var OrderSchema = mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  authorName: {
    type: String,
    required : true
  },
  authorId: {
    type: String,
    required : true
  },
  authorAvatar: {
    type: String,
  },
  subject: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  executorName: String,
  executorId: String,
  executorAvatar: String,
  date: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  files: String,
  resolutions: {
    authorName: {
      type: String,
    },
    authorId: {
      type: String,
    },
    authorAvatar: {
      type: String,
    },
    created: {
      type: Date,
    },
    files: {
      type: String,
    },
    status: {
      type: String,
			enum: ['active','oncheck','checked', 'unactive']
    }
  },
  status: {
      type: String,
			enum: ['active','assigned','oncheck','checked', 'unactive']
  },
  modified: { type: Date, default: Date.now }
});

OrderSchema.pre('remove', function(next) {
  var doc = this;
  Subjects.findOne({ name: doc.subject }, function(error, subject) {
    if (!subject){
    console.log("error" + error);
      return 'false';
    }
    subject.seq=subject.seq-1;
    if (subject.seq < 1) {
      subject.remove(function (err) {
          if (!err) {
              console.log('Removed');
          } else {
              res.statusCode = 500;
              console.log('ErroR 190');
          }
      });
    }else{
      subject.save(function(err, result) {
        if (err)
          console.log(err);
      });
    }
  });
  next();
});

OrderSchema.pre('save', function(next) {
  if (this.id){
    next();
  }
  var doc = this;

  Counter.findByIdAndUpdate('orderid', {
    $inc: {
      seq: 1
    }
  }, function(error, counter) {
    if (typeof counter === 'undefined' || counter == '' || counter == null) {
      console.log('NULL');
      var newCounter = Counter({
        _id: 'orderid',
        seq: 0
      });
      newCounter.save(function(err, result) {
        doc.id = this.seq;
        console.log("RESULT" + result);
        if (err)
          console.log(err);
      });
    } else {
      if (error)
        return next(error);
      doc.id = counter.seq;
      next();

    }
  });

  Subjects.findOneAndUpdate({
    name: doc.subject
  }, {
    $inc: {
      seq: 1
    }
  }, function(error, subject) {
    if (typeof subject === 'undefined' || subject == '' || subject == null) {
      var newSubject = Subjects({
        name: doc.subject,
        seq: 1
      });
      newSubject.save(function(err, Subject) {
        if (err)
          console.log(err);
      });
    };
  });
});

OrderSchema.path('subject').validate(function (v) {
	return v.length > 5 && v.length < 70;
});

module.exports = mongoose.model('Order', OrderSchema);
