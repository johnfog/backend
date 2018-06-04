var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Contact = new Schema({
	userid: { type: String, required: true },
	username: { type: String, required: true },
	avatarSrc: { type: String }
});

var ContactSchema = new mongoose.Schema({
  userid: { type: String, required: true },
  contacts: [Contact]  
});

module.exports = mongoose.model('Contacts', ContactSchema);
