var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  sentAt: { type: Date, default: Date.now },
  authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
  //username: { type: String, required: true },
  //authorId: { type: String, required: true },
  text:  { type: String, required: true },
  //authorId: { type: String, required: true },
  //avatarSrc: { type: String },
  room:  { type: String, required: true },
  
});

module.exports = mongoose.model('Messages', MessageSchema);
