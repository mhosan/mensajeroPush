const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');
const categoriasEsquema = require('../modelos/category');

const ctrlSubscripciones = {};

//---------------------------------------------------------------------
// recibiendo (y persistiendo) subscripción
//---------------------------------------------------------------------
ctrlSubscripciones.postSubscripcion = async (req, res) => {
    pushSubscription = req.body;
    console.log('Llegó una suscripción: ', pushSubscription);
    if (req.useragent.isChrome) {
        console.log(`El navegador utilizado es Chrome`);
    } else {
        console.log(`el navegador NO es chrome`);
        res.status(400).json(`El navegador NO es Chrome. Actualmente único navegador soportado: Chrome.`);
        return;
    }

    await suscripcionesEsquema.update({ 'keys.auth': pushSubscription.keys.auth },
        {
            $set:
            {
                fechaAlta: new Date(),
                endpoint: pushSubscription.endpoint,
                expirationTime: pushSubscription.expirationTime,
                keys: {
                    p256dh: pushSubscription.keys.p256dh,
                    auth: pushSubscription.keys.auth
                }
            }
        },
        { upsert: true }, (err, result) => {
            if (err) {
                console.log(`Error: ${err}`);
                res.status(500).json(`Error al guardar la susbscripción. Error: ${err}`);
            } else {
                console.log(`Guardado de la subscripción ok!`);
                res.status(200).json(`La subscripción se guardó ok.`);
            }
        });
}

//---------------------------------------------------------------------
// recibiendo y actualizando la subscripción. Se le agregan datos para
// identificar al usuario, por ahora es el mail.
//---------------------------------------------------------------------
ctrlSubscripciones.putSubscripcion = async (req, res) => {
    console.log(req.body);
    const filter = { 'keys.auth': req.body.auth };
    const actuMail = { 'mail': req.body.mail }

    await suscripcionesEsquema.findOneAndUpdate(filter, actuMail, { new: true }, (err, doc) => {
        if (err) {
            console.log(`Error al actualizar la subscripción con el mail: ${err}`);
            res.status(500).json(`Error al actualizar la subscripción con el mail: ${err}`);
        } else {
            console.log(`doc.keys.auth: ${doc.keys.auth}, doc.mail: ${doc.mail}`);
            res.status(200).json(`Actualización de la subscripción ok!`);
        }
    })
}

//---------------------------------------------------------------------
// delete subscripcione, este request se invoca via api rest
//---------------------------------------------------------------------
ctrlSubscripciones.deleteSubscripcion = async (req, res) => {
    console.log(`Se recibió un pedido de borrar ${req.params.auth}`);
    await suscripcionesEsquema.findOneAndDelete({ "keys.auth": req.params.auth }, (err) => {
        if (err) {
            console.log(`Hubo un error al borrar la suscripción ${req.params.auth}. Error: ${err}`);
            res.status(500).json(`Hubo un error al borrar la suscripción ${req.params.auth}. Error: ${err}`);
        } else {
            console.log(`Se borró la suscripción ${req.params.auth}`);
            res.status(200).json(`Se borró la suscripción ${req.params.auth}`);
        }
    });
}

//---------------------------------------------------------------------
// borrar suscripcion. se recibe como param el codigo auth
// OJO, esto se ejecuta desde el código main en el cliente!. NO es una
// llamada API request tradicional
//---------------------------------------------------------------------
ctrlSubscripciones.borrarSubscripcion = async (req, res) => {
    // console.log(`Se recibió un pedido de borrar ${req.body.valor}`);
    // let buscar = JSON.stringify(req.body.valor); //convertir el objeto recibido en string
    // buscar = buscar.slice(4, -3);  //limpiarlo
    // console.log(buscar);
    suscripcionesEsquema.findOneAndDelete({"keys.auth" : req.body.valor}, (err, respuesta)=>{
        if(err) console.log(`Hubo un error al borrar la suscripción ${req.body.valor}. Error: ${err}`); 
        console.log(`Se borró la suscripción ${req.body.valor}`);
    })
}

//---------------------------------------------------------------------
// listar todas las subscripciones
//---------------------------------------------------------------------
ctrlSubscripciones.getSubscripciones = async (req, res) => {
    await suscripcionesEsquema.find().sort({ 'fechaAlta': -1 }).exec()
        .then((respuesta) => {
            res.status(200).json(respuesta);
        })
        .catch((err) => {
            res.status(500).json(`Error en el find subscripciones: ${err}`);
        })


}



module.exports = ctrlSubscripciones;