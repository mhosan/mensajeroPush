const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var categorySchema = new Schema({
    catIndex: Number,
    catLabel: String,
    catDescrip: String,
},
    { versionKey: false }
);

module.exports = mongoose.model('categorias', categorySchema);
