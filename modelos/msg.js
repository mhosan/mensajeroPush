const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var msgSchema = new Schema({
    fechaAlta: Date,
    msg: {
        title: String,
        message: String
    },
    keys: {
        p256dh: String,
        auth: String
    }
},
    { versionKey: false }
);

module.exports = mongoose.model('Mensajes', msgSchema);
