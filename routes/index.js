const { Router } = require('express');  //traer una parte de express
const router = Router();
const mongoose = require('mongoose');
const webpush = require('../webpush');
var Schema = mongoose.Schema;
const suscripcionesEsquema = require('../modelos/subsc');

let pushSubscription;

router.post('/subscription', async (req, res) => {
    pushSubscription = req.body;
    res.status(200).json();
    console.log('Llegó una suscripción: ', pushSubscription);

    // -- persistir ---------------------------------------------------
    var suscripGuardar = suscripcionesEsquema({
        fechaAlta: new Date(),
        endpoint: pushSubscription.endpoint,
        expirationTime: pushSubscription.expirationTime,
        keys: {
            p256dh: pushSubscription.keys.p256dh,
            auth: pushSubscription.keys.auth
        }
    });

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
            console.log(`Guardado ok! ${result}`);
        });


    // -- persistir ---------------------------------------------------

});

router.post('/new-message', async (req, res) => {
    const { message } = req.body;
    const payload = JSON.stringify({
        title: 'Mi notificación personalizada, ajustando borrador',
        message: message
    });
    await webpush.sendNotification(pushSubscription, payload)  //<--sendNotification es una promesa
        .then()
        .catch((err) => {

            if (err.statusCode === 410) {
                console.log(`Error, la subscripción ya no es válida:  ${err}`);
            } else {
                console.log(`Error:  ${err}`);
            }
        });
});
module.exports = router;
