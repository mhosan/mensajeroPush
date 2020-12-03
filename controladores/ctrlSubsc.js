const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');
const categoriasEsquema = require('../modelos/category');
const ctrlSubscripciones = {};

//get subscripciones
ctrlSubscripciones.getSubscripciones = async (req, res) => {
    const subscripciones = await suscripcionesEsquema.find();
    
    res.status(200).json(subscripciones)
}


module.exports = ctrlSubscripciones;