var mongoose = require('mongoose');

var SubjectsSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  seq: Number,
});

module.exports = mongoose.model('Subjects', SubjectsSchema);
