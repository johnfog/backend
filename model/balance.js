var mongoose = require('mongoose');

var BalanceSchema = new mongoose.Schema({
  userid: { type: String, unique: true, required: true },
  value: {type: Number,default: 0 },
  blocked: {type: Number,	default: 0 },
});

module.exports = mongoose.model('Balance', BalanceSchema);
