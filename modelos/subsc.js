const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscripcionesSchema = new Schema({
    fechaAlta : Date,
    endpoint : String,
    expirationTime : Date,
    keys : {
        p256dh : String,
        auth : String
    }
});

module.exports = mongoose.model('Suscripciones', subscripcionesSchema);
