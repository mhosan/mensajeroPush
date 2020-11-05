const { Router} = require('express');  //traer una parte de express
const router = Router();

const webpush = require('../webpush');
let pushSubscription;

router.post('/subscription', async (req, res) => {
    //console.log('recibido en el req.body:', req.body);
    pushSubscription = req.body;
    res.status(200).json();
});

router.post('/new-message', async (req, res) =>{
    const {message} = req.body;

    const payload = JSON.stringify({
        title : 'Mi notificación personalizada, tercer borrador',
        message : message
    });
    
    try {
        await webpush.sendNotification(pushSubscription, payload);
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;
