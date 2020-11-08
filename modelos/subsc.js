const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscripcionesSchema = new Schema({
    codigo : String,
    otro : String
});

module.exports = mongoose.model('Suscripciones', subscripcionesSchema);
