const { Router } = require('express');  //traer una parte de express
const router = Router();
const mongoose = require('mongoose');
const webpush = require('../webpush');
var Schema = mongoose.Schema;
const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');
const categoriasEsquema = require('../modelos/category');

let pushSubscription;
let subscripcionDestino;

//---------------------------------------------------------------------
// pagina principal
//---------------------------------------------------------------------
router.get('/', (req, res) => {
    let jsonSuscrip = [];
    let jsonMsg = [];
    suscripcionesEsquema.find().exec()  //<--leer subscripciones
        .then((suscrip) => {
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
            mensajesEsquema.find().exec()  //<--leer mensajes
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
                    // let unaCategoria = new categoriasEsquema(
                    //     {
                    //     catIndex : 5,
                    //     catLabel : 'Remates',
                    //     catDescrip : 'El tema de los remates'
                    // });
                    // unaCategoria.save();
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
                res.status(552).json(`Error al guardar la susbscripción. Error: ${err}`);
            } else {
                console.log(`Guardado de la subscripción ok!`);
                res.status(200).json(`La subscripción se guardó ok.`);
            }
        });
});

//---------------------------------------------------------------------
// recibiendo y actualizando la subscripción. Se le agregan datos para
// identificar al usuario, por ahora es el mail.
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
            console.log(`doc.keys.auth: ${doc.keys.auth}, doc.mail: ${doc.mail}`);
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
// mh, 24/11/20
// Enviar mensaje,
// recibe cuatro parametros:
// 1 mail,          es el mail del destinatario. Entrar en la tabla suscrip
//                  con el mail y buscar el identificador "auth" correspond.
// 2 titulo,        es el titulo de la notificación push
// 3 msg            es el texto de la notificación push
// 4 idcat          es un int con la categoria de notificación push. Entrar en la tabla
//                  categorias con el int y adjuntar a la notif el texto de 
//                  la categoria.
// 5 status ?       Se habló de un item "status" pero por ahora no está definido.
//---------------------------------------------------------------------
router.post('/new-message', (req, res) => {
    let postError = "";
    const cantidadParametros = Object.keys(req.body).length;
    if (!cantidadParametros == 4) {
        postError = postError + " No hay cuatro parametros. ";
    }
    if (!req.body.mail) {
        postError = postError + " El Json no trae el elemento mail.";
    }
    if (!req.body.titulo) {
        postError = postError + " El Json no trae el elemento titulo.";
    }
    if (!req.body.msg) {
        postError = postError + " El Json no trae el elemento msg.";
    }
    if (!req.body.idcat) {
        postError = postError + " El Json no trae el elemento idcat.";
    }
    if (!postError == "") {
        console.log(postError);
        res.status(420).json(`Error: ${postError}`);
        return
    }
    const { mail } = req.body;
    const { titulo } = req.body;
    const { msg } = req.body;
    const { idcat } = req.body;
    //buscar el auth a partir del mail:
    suscripcionesEsquema.find({ 'mail': mail }).exec()
        .then((doc) => {
            const cant = doc.length;
            console.log(`Cantidad de elementos ${cant}`);
            if(cant == 0){
                console.log('no se encontró ese mail');
                return;
            }
            
            doc.forEach(element => {
                //encontrada/s la/s subscripcion/nes, recuperar el auth para armar el payload, luego
                //armar el objeto subscripcion a utilizar para enviar el msg y armar un objeto
                //msg para persistir
                const payload = JSON.stringify({
                    title: titulo,
                    bodyMessage: msg,
                    iconImage: '-',
                    date: new Date(),
                    category: idcat,
                    status: 99,
                    auth: element.keys.auth
                });
                //armar el objeto subscripcion para enviar el mensaje con webpush
                subscripcionDestino = {
                    endpoint: element.endpoint,
                    keys: {
                        p256dh: element.keys.p256dh,
                        auth: element.keys.auth
                    }
                };
                //con la subscripción y con el payload enviar el mensaje
                webpush.sendNotification(subscripcionDestino, payload)
                    //el mensaje se envió bien
                    .then(() => {
                        // setear el objeto mensaje a guardar
                        var msgGuardar = new mensajesEsquema({
                            title: (JSON.parse(payload)).title,
                            bodyMessage: (JSON.parse(payload)).message,
                            iconImage: (JSON.parse(payload)).iconImage,
                            date: (JSON.parse(payload)).date,
                            category: (JSON.parse(payload)).category,
                            status: (JSON.parse(payload)).status,
                            auth: (JSON.parse(payload)).auth
                        });
                        res.status(200).json('Mensaje enviado');
                        //guardar el objeto mensaje
                        msgGuardar.save((err) => {
                            if (err) console.log(`Hubo un error al guardar el msg. Error: ${err}`);
                            console.log('Guardado del msg en mongo ok!');
                        });
                    })
                    .catch((err) => {
                        //error al enviar el mensaje
                        if (err.statusCode === 410) {
                            console.log(`Error, la subscripción ya no es válida:  ${err.body}`);
                            res.status(450).json(`Error, la subscripción ya no es válida`);
                        } else {
                            console.log(`Error al enviar el mensaje:  ${err}`);
                            res.status(550).json(`Error al enviar el msg. Error: ${err}`);
                        }
                    })
            })
        })
        .catch((err) => {
            console.log(`Error al buscar el auth a partir del mail`);
            res.status(551).json(`Error en el find de la suscrip. destinataria del mensaje. Error: ${err}`);
        });
});

module.exports = router;

