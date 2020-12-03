const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var msgSchemaSender = new Schema({
    mail: String,
    title: String,
    bodyMessage: String,
    category: Number,
    iconImage: String,
    date: Date,
    status: Number,
    auth: String,
    senderDTO: {
        id: Number,
        fullname: String,
        avatar: String,
        email: String
    }
    
},
    { versionKey: false }
);

module.exports = mongoose.model('Mensajes', msgSchemaSender);
