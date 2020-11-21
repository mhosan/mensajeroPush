const { Router } = require('express');  //traer una parte de express
const router = Router();
const mongoose = require('mongoose');
const webpush = require('../webpush');
var Schema = mongoose.Schema;
const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');

let pushSubscription;
let subscripcionDestino;

//---------------------------------------------------------------------
// pagina principal
//---------------------------------------------------------------------
router.get('/', (req, res) => {
    let jsonSuscrip = [];
    let jsonMsg = [];
    suscripcionesEsquema.find().exec()
        .then((suscrip) => {
            //console.log(suscrip);
            suscrip.forEach(element => {
                let fechaMongo = new Date(element.fechaAlta);
                fechaLocal = fechaMongo.toLocaleString('es-AR');
                const elementoJson = {
                    keyAuth: element.keys.auth,
                    fechaAlta: fechaLocal,
                    mail: element.mail
                };
                jsonSuscrip.push(elementoJson);
            });
            mensajesEsquema.find().exec()
                .then((msgs) => {
                    msgs.forEach(itemMensaje => {
                        let fechaMsg = new Date(itemMensaje.date);
                        fechaMsgLocal = fechaMsg.toLocaleString('es-AR');
                        const elementoMsgJson = {
                            title: itemMensaje.title,
                            bodyMessage: itemMensaje.bodyMessage,
                            iconImage: itemMensaje.iconImage,
                            date: fechaMsgLocal,
                            category: itemMensaje.category,
                            status: itemMensaje.status,
                            auth: itemMensaje.auth,
                            
                        };
                        jsonMsg.push(elementoMsgJson);
                    })
                    res.render('template', { suscriptos: jsonSuscrip, mensajes: jsonMsg });
                })
                .catch((err) => {
                    console.log(`Error en el find de mensajes: ${err}`);
                });
        })
        .catch((err) => {
            console.log(`Error en el find de suscrip: ${err}`);
        });
});

//---------------------------------------------------------------------
// recibiendo (y persistiendo) subscripción
//---------------------------------------------------------------------
router.post('/subscription', (req, res) => {
    pushSubscription = req.body;

    console.log('Llegó una suscripción: ', pushSubscription);
    suscripcionesEsquema.update({ 'keys.auth': pushSubscription.keys.auth },
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
                //res.status(552).json(`Error al guardar la susbscripción. Error: ${err}`);
            } else {
                console.log(`Guardado de la subscripción ok!`);
                //res.status(200).json(`La subscripción se guardó ok. ${result}`);
            }
        });
});


//---------------------------------------------------------------------
// recibiendo y actualizando la subscripción
//---------------------------------------------------------------------
router.put('/', async (req, res) => {
    console.log(req.body);
    const filter = { 'keys.auth': req.body.auth };
    const actuMail = { 'mail': req.body.mail }

    await suscripcionesEsquema.findOneAndUpdate(filter, actuMail, { new: true }, (err, doc) => {
        if (err) {
            console.log(`Error al actualizar la subscripción con el mail: ${err}`);
            res.status(555).json(`Error al actualizar la subscripción con el mail: ${err}`);
        } else {
            console.log(`doc.keys.auth: ${doc.keys.auth}, doc.mail: ${doc.mail}, ip: ${ip}`);
            res.status(200).json(`Actualización de la subscripción ok!`);
        }
    })
});

//---------------------------------------------------------------------
// borrar suscripcion. se recibe como param el codigo auth
// OJO, esto se ejecuta desde una llamada request a esta API
//---------------------------------------------------------------------
router.delete('/delete/:auth', (req, res) => {
    console.log(`Se recibió un pedido de borrar ${req.params.auth}`);
    suscripcionesEsquema.findOneAndDelete({ "keys.auth": req.params.auth }, (err) => {
        if (err) {
            console.log(`Hubo un error al borrar la suscripción ${req.params.auth}. Error: ${err}`);
            res.status(554).json(`Hubo un error al borrar la suscripción ${req.params.auth}. Error: ${err}`);
        } else {
            console.log(`Se borró la suscripción ${req.params.auth}`);
            res.status(200).json(`Se borró la suscripción ${req.params.auth}`);
        }
    });

});

//---------------------------------------------------------------------
// borrar suscripcion. se recibe como param el codigo auth
// OJO, esto se ejecuta desde el código main en el cliente!. NO es una
// llamada API request
//---------------------------------------------------------------------
router.put('/borrar', (req, res) => {
    console.log(`Se recibió un pedido de borrar ${req.body.valor}`);
    let buscar = JSON.stringify(req.body.valor); //convertir el objeto recibido en string
    buscar = buscar.slice(4, -3);  //limpiarlo
    console.log(buscar);
    // suscripcionesEsquema.findOne({"keys.auth" : buscar}, (err, respuesta)=>{
    //     if(err) console.log(err);
    //     console.log(respuesta);
    // })
    suscripcionesEsquema.remove({ "keys.auth": buscar }).exec()
        .then((respuesta) => {
            console.log(`Se borró la suscripción ${req.body.valor}`);
        })
        .catch((err) => {
            console.log(`Hubo un error al borrar la suscripción ${req.body.valor}. Error: ${err}`);
        })
});

//---------------------------------------------------------------------
// enviar mensaje
//---------------------------------------------------------------------
router.post('/new-message', (req, res) => {
    const { message } = req.body;
    const { destino } = req.body;

    const payload = JSON.stringify({
        title: 'Notif. Peygol',
        message: message
    });

    suscripcionesEsquema.find({ 'keys.auth': destino }).exec()
        .then((susDestino) => {
            subscripcionDestino = {
                endpoint: susDestino[0].endpoint,
                keys: {
                    p256dh: susDestino[0].keys.p256dh,
                    auth: susDestino[0].keys.auth
                },
            };
            //console.log('subscripcion a enviar: ', subscripcionDestino);
            webpush.sendNotification(subscripcionDestino, payload)
                .then(() => {
                    //setear el objeto mensaje a guardar
                    var msgGuardar = new mensajesEsquema({
                        title: (JSON.parse(payload)).title,
                        bodyMessage: (JSON.parse(payload)).message,
                        iconImage: 'nada',
                        date: new Date(),
                        category: 99,
                        status: 99,
                        auth: subscripcionDestino.keys.auth
                    });
                    res.status(200).json('Mensaje enviado');
                    //guardar el objeto mensaje
                    msgGuardar.save((err) => {
                        if (err) console.log(`Hubo un error al guardar el msg. Error: ${err}`);
                        console.log('Guardado del msg en mongo ok!');
                    });
                })
                .catch((err) => {
                    if (err.statusCode === 410) {
                        console.log(`Error, la subscripción ya no es válida:  ${err.body}`);
                        res.status(450).json(`Error, la subscripción ya no es válida`);
                    } else {
                        console.log(`Error al enviar el mensaje:  ${err}`);
                        res.status(550).json(`Error al enviar el msg. Error: ${err}`);
                    }
                });
        })
        .catch((err) => {
            console.log(`Error en el find de la suscrip. destinataria del mensaje: ${err}`);
            res.status(551).json(`Error en el find de la suscrip. destinataria del mensaje. Error: ${err}`);
        });

});

module.exports = router;

