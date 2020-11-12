const { Router } = require('express');  //traer una parte de express
const router = Router();
const mongoose = require('mongoose');
const webpush = require('../webpush');
var Schema = mongoose.Schema;
const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');

let pushSubscription;
let subscripcionDestino;

router.get('/', (req, res) => {
    //buscar en la db las subscripciones que hay
    let jsonSuscrip = [];
    let jsonMsg = [];
    suscripcionesEsquema.find().exec((err, suscript) => {
        if (err) console.log(`Error: ${err}`);
        suscript.forEach(element => {
            let fechaMongo = new Date(element.fechaAlta);
            fechaLocal = fechaMongo.toLocaleString('es-AR');
            const elementoJson = {
                keyAuth: element.keys.auth,
                fechaAlta: fechaLocal
            };
            jsonSuscrip.push(elementoJson);
        });
        mensajesEsquema.find().exec((err, msgs) =>{
            if(err) console.log(`Error: ${err}`);
            msgs.forEach(itemMensaje =>{
                let fechaMsg = new Date(itemMensaje.fechaAlta);
                fechaMsgLocal = fechaMsg.toLocaleString('es-AR');
                const elementoMsgJson = {
                    titulo : itemMensaje.msg.title,
                    message : itemMensaje.msg.message,
                    auth : itemMensaje.keys.auth,
                    fechaAlta : fechaMsgLocal
                };
                jsonMsg.push(elementoMsgJson);
            });
            res.render('template',{suscriptos : jsonSuscrip, mensajes : jsonMsg});
        });
    });
    //     suscripcionesEsquema.count((err, count) => {
    //         console.log(count);
    //         suscripcionesEsquema.
});


router.get('/sus', (req, res) => {
    res.render('sus', { subscripcion: JSON.stringify(pushSubscription) });
});


router.post('/subscription', async (req, res) => {
    pushSubscription = req.body;
    res.status(200).json();
    console.log('Llegó una suscripción: ', pushSubscription);
    // -- persistir ---------------------------------------------------
    // var suscripGuardar = suscripcionesEsquema({
    //     fechaAlta: new Date(),
    //     endpoint: pushSubscription.endpoint,
    //     expirationTime: pushSubscription.expirationTime,
    //     keys: {
    //         p256dh: pushSubscription.keys.p256dh,
    //         auth: pushSubscription.keys.auth
    //     }
    // });

    //const resultado = await suscripcionesEsquema.find({});
    //console.log(resultado);

    // suscripGuardar.save((err) => {
    //    if (err) throw err;
    //    console.log('Guardado en mongo ok!');
    // });

    // suscripcionesEsquema.updateOne({'fechaAlta' : {$gt : new Date("2000, 10, 22")}}, 
    //     { $set : {'fechaAlta' : new Date("2000, 10, 25")} },
    //     {new : true})
    //     .then((guardado) =>{
    //         console.log(guardado);
    //     })
    //     .catch((err)=>{
    //         console.log(`Error: ${err}`);
    //     });
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
    // -- persistir ---------------------------------------------------
});


//---------------------------------------------------------------------
// enviar mensaje
//---------------------------------------------------------------------
router.post('/new-message', async (req, res) => {
    const { message } = req.body;
    const { destino } = req.body;
    suscripcionesEsquema.find({'keys.auth' : destino}, {'fechaAlta':0,'_id':0,'__v':0}).exec((err, susDestino) => {
        if (err) console.log(`Error: ${err}`);
        //expirationTime : susDestino[0].expirationTime,
        
        subscripcionDestino = {
            "endpoint" : susDestino[0].endpoint,
            "keys" : {
                "p256dh" : susDestino[0].keys.p256dh,
                "auth" : susDestino[0].keys.auth
            }
        };
        console.log('subscripcion a enviar: ', subscripcionDestino);
    });
    const payload = JSON.stringify({
        title: 'Notif. personal, ajustando...',
        message: message
    });
    await webpush.sendNotification(subscripcionDestino, payload)  //<--sendNotification es una promesa
        .then(() => {
            var msgGuardar = new mensajesEsquema({
                fechaAlta: new Date(),
                msg: {
                    title: (JSON.parse(payload)).title,
                    message: (JSON.parse(payload)).message
                },
                keys: {
                    p256dh: subscripcionDestino.keys.p256dh, //pushSubscription.keys.p256dh,
                    auth: subscripcionDestino.keys.auth //pushSubscription.keys.auth
                }
            });
            msgGuardar.save((err) => {
                if (err) console.log(`Hubo un error al guardar el msg. Error: ${err}`);
                console.log('Guardado del msg en mongo ok!');
            });

        })
        .catch((err) => {
            if (err.statusCode === 410) {
                console.log(`Error, la subscripción ya no es válida:  ${err}`);
            } else {
                console.log(`Error-->:  ${err}`);
            }
        });
});

module.exports = router;

