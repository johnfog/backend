var mongoose = require('mongoose');

var PaymentsSchema = new mongoose.Schema({
  userid: String,
  request_id: { type: String, unique: true, required: true },
  instance_id: { type: String, required: true },
  status: { type: String, required: true },
  value: { type: String, required: true },
  created: {type: Date,default: Date.now}
});

module.exports = mongoose.model('Payments', PaymentsSchema);
