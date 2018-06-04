// Load required packages
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ResolutionSchema = mongoose.Schema({
  orderId: {
    type: String,
    required : true
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
  created: {
    type: Date,
    default: Date.now
  },
  files: {
    type: String,
    required : true
  },
  status: {
    type: String,
  },
});

module.exports = mongoose.model('Resolution', ResolutionSchema);
