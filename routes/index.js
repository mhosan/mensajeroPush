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
    var suscrip = new suscripcionesEsquema({
       codigo: pushSubscription.keys.auth,
       otro: pushSubscription.keys.p256dh
    });
    suscrip.save((err) => {
       if (err) throw err;
       console.log('Guardado en mongo ok!');
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
            
            if(err.statusCode === 410){
                console.log(`Error, la subscripción ya no es válida:  ${err}`);
            } else {
                console.log(`Error:  ${err}`);
            }
        });
});
module.exports = router;
