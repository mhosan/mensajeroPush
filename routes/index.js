const { Router } = require('express');  //traer una parte de express
const router = Router();
//const mongoose = require('mongoose');
//var Schema = mongoose.Schema;
//const suscripcionesEsquema = require('../modelos/subsc');

const webpush = require('../webpush');
let pushSubscription;

router.post('/subscription', async (req, res) => {
    pushSubscription = req.body;
    res.status(200).json();
    console.log('Llegó una suscripción: ', pushSubscription);

    //var suscrip = new suscripcionesEsquema({
    //    codigo: '1234',
    //    otro: 'otro dato'
    //});
    //suscrip.save((err) => {
    //    if (err) throw err;
    //    console.log('Guardado ok!');
    //});

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
