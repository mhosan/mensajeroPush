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
                    fechaAlta: fechaLocal
                };
                jsonSuscrip.push(elementoJson);
            });
            mensajesEsquema.find().exec()
                .then((msgs) => {
                    msgs.forEach(itemMensaje => {
                        let fechaMsg = new Date(itemMensaje.fechaAlta);
                        fechaMsgLocal = fechaMsg.toLocaleString('es-AR');
                        const elementoMsgJson = {
                            titulo: itemMensaje.msg.title,
                            message: itemMensaje.msg.message,
                            auth: itemMensaje.keys.auth,
                            fechaAlta: fechaMsgLocal
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
// recibiendo y actualizando la subscripción
//---------------------------------------------------------------------
router.put('/', async (req, res)=>{
    //console.log(req.body);
    const filter = { 'keys.auth' : req.body.auth} ;
    const actuMail = { 'mail': req.body.mail }
    
    await suscripcionesEsquema.findOneAndUpdate(filter, actuMail, {new: true},(err, doc)=>{
        if(err) console.log(`Error al actualizar la subscripción con el mail: ${err}`);

        console.log(`doc.keys.auth: ${doc.keys.auth}, doc.mail: ${doc.mail}`);
        //res.send('[PUT]Saludos desde express');
        res.status(200).json();
    })
});
        
//---------------------------------------------------------------------
// recibiendo (y persistiendo) subscripción
//---------------------------------------------------------------------
router.post('/subscription', (req, res) => {
    pushSubscription = req.body;
    res.status(200).json();
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
        { upsert: true },
        function (err, result) {
            if (err) console.log(`Error: ${err}`);
            console.log(`Guardado de la subscripción ok! ${result}`);
        });
});

//---------------------------------------------------------------------
// enviar mensaje
//---------------------------------------------------------------------
router.post('/new-message', (req, res) => {
    const { message } = req.body;
    const { destino } = req.body;

    const payload = JSON.stringify({
        title: 'Notif. personal, ajustando...',
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
                        fechaAlta: new Date(),
                        msg: {
                            title: (JSON.parse(payload)).title,
                            message: (JSON.parse(payload)).message
                        },
                        keys: {
                            p256dh: subscripcionDestino.keys.p256dh,
                            auth: subscripcionDestino.keys.auth
                        }
                    });
                    //guardar el objeto mensaje
                    msgGuardar.save((err) => {
                        if (err) console.log(`Hubo un error al guardar el msg. Error: ${err}`);
                        console.log('Guardado del msg en mongo ok!');
                    });
                })
                .catch((err) => {
                    if (err.statusCode === 410) {
                        console.log(`Error, la subscripción ya no es válida:  ${err.body}`);
                        
                    } else {
                        console.log(`Error al enviar el mensaje:  ${err}`);
                    }
                });
        })
        .catch((err) => {
            console.log(`Error en el find de la suscrip. destinataria del mensaje_: ${err}`);
        });

});
module.exports = router;

