const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');
const mensajesConSenderEsquema = require('../modelos/msgSender');
const categoriasEsquema = require('../modelos/category');
const webpush = require('../webpush');
//const moment = require('moment');
const ctrlMsg = {};
let mensajeError = [];

const guardarMsg = (msgGuardar) => {
    let guardarMensajeError = false;
    msgGuardar.save((err) => {
        if (err) {
            console.log(`Hubo un error al guardar el msg. Error: ${err}`);
            //res.status(500).json(`Error al guardar el msg en la base de datos`);
            guardarMensajeError = true;
        } else {
            console.log('Guardado del msg en mongo ok!');
            //res.status(201).json('Mensaje enviado ok y persistido en la db ok');
            guardarMensajeError = false;
        }
    });
    return guardarMensajeError;
}

const enviarMsg = async (subscripcionDestino, payload) => {
    await webpush.sendNotification(subscripcionDestino, payload)
        .then(() => {
            console.log('2do then, ok!');
            mensajeError.push(0);
        })
        .catch((err) => {
            console.log('2do then, ', err);
            mensajeError.push(1);
        })
    return mensajeError
}

//---------------------------------------------------------------------
// post new-message con sender
//---------------------------------------------------------------------
ctrlMsg.newMessageSender = (req, res) => {
    let mensajeEnviado = 0;

    let postError = "";
    const cantidadParametros = Object.keys(req.body).length;
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
        return;
    }
    const { mail } = req.body;
    const { titulo } = req.body;
    const { msg } = req.body;
    const { idcat } = req.body;
    const { senderDTO } = req.body;
    const { id } = senderDTO;
    const { fullname } = senderDTO;
    const { avatar } = senderDTO;
    const { email } = senderDTO;
    //console.log(`id: ${id}, fullname: ${fullname}, avatar: ${avatar}, sender email: ${email}`);

    //buscar el auth a partir del mail:
    suscripcionesEsquema.find({ 'mail': mail }).exec()
        .then((doc) => {
            const cant = doc.length;
            console.log(`Cantidad de mails para este auth: ${cant}`);
            //const nuevoDoc = verificarAuths(doc);
            if (cant == 0) {
                console.log('no se encontró ese mail');
                res.status(550).json(`No se encontró ese mail en la db`);
                return;
            }
            return doc;
        })
        .then((doc) => {
            //doc.forEach(element => {
            for (let i = 0; i < doc.length; i++) {
                const payload = JSON.stringify({
                    title: titulo,
                    message: msg
                });
                const subscripcionDestino = {
                    endpoint: doc[i].endpoint,
                    keys: {
                        p256dh: doc[i].keys.p256dh,
                        auth: doc[i].keys.auth
                    }
                };
                let resultadoEnviar = enviarMsg(subscripcionDestino, payload);
                resultadoEnviar.then((algo) => {
                    console.log(`algo: ${algo}`);
                    if (i === doc.length-1) {
                        console.log(`i: ${i}, algo: ${algo}, mensajeError: ${mensajeError}`);
                        const huboError = mensajeError.indexOf(1);
                        if(huboError == -1){
                            console.log('no hubo error')
                            res.status(200).json(`Mensaje/s enviado/s ok`);
                        } else {
                            console.log('si, hubo error')
                            if(mensajeError.length > 1){
                                res.status(500).json(`Error con el envio de alguna notif.`);
                            } else {
                                res.status(500).json(`Error con el envio de la notif.`); 
                            }
                        }
                    }
                })
            };
        })
        .catch(err => {
            console.log(`error en el envio: ${err}`)
        })

        // for (const element of doc) {
        //     //doc.forEach(element => {
        //     //encontrada/s la/s subscripcion/nes, recuperar el auth para armar el payload, luego
        //     //armar el objeto subscripcion a utilizar para enviar el msg y armar un objeto
        //     //msg para persistir

        //     //payload
        //     const payload = JSON.stringify({
        //         title: titulo,
        //         message: msg
        //     });

        //     //armar el objeto subscripcion para enviar el mensaje con webpush
        //     subscripcionDestino = {
        //         endpoint: element.endpoint,
        //         keys: {
        //             p256dh: element.keys.p256dh,
        //             auth: element.keys.auth
        //         }
        //     };

        //     //con la subscripción y con el payload enviar el mensaje
        //     webpush.sendNotification(subscripcionDestino, payload)
        //         .then(() => {
        //             console.log('el mensaje se envió bien!');
        //             var msgGuardar = new mensajesConSenderEsquema({
        //                 title: (JSON.parse(payload)).title,
        //                 bodyMessage: msg,
        //                 iconImage: '-',
        //                 date: new Date(),
        //                 category: idcat,
        //                 status: 0,
        //                 auth: element.keys.auth,
        //                 mail: mail,
        //                 senderDTO: {
        //                     id: id,
        //                     fullname: fullname,
        //                     avatar: avatar,
        //                     email: email
        //                 }
        //             });
        //             const guardadoMensajeError = guardarMsg(msgGuardar);
        //         })
        //         .catch((err) => {
        //             //error al enviar el mensaje
        //             if (err.statusCode === 410) {
        //                 console.log(`Error, la subscripción ya no es válida:  ${err.body}`);
        //                 //res.status(450).json(`Error, la subscripción ya no es válida`);
        //                 mensajeError = mensajeError + 1;
        //             } else {
        //                 console.log(`Error al enviar el mensaje:  ${err}`);
        //                 //res.status(550).json(`Error al enviar el msg. Error: ${err}`);
        //                 mensajeError = mensajeError + 1;
        //             }
        //         })
        // } //<---pie del foreach
        // if (mensajeError === 0) {
        //     console.log(`Mensaje/s enviado/s ok.`);
        //     res.status(200).json(`Mensaje/s enviado/s ok.`);
        // } else {
        //     console.log(`Error en ${mensajeError} mensaje/s`);
        //     res.status(550).json(`Error al enviar el msg.`);
        // }
        //})
        .catch((err) => {
            console.log(`Error al buscar el auth a partir del mail`);
            res.status(500).json(`Error en el find de la suscripcion destinataria del mensaje. Error: ${err}`);
        });

}

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
ctrlMsg.newMessage = async (req, res) => {
    res.status(204).json(`Discontinuado por el momento. Sepa disculpar las molestias.`);
    return;
}

//---------------------------------------------------------------------
// listar notificaciones a partir de un mail
// { 'mail' : 'algo@gmail.com'}
//---------------------------------------------------------------------
ctrlMsg.listarNotificaciones = async (req, res) => {
    const mail = req.params.mail;
    //mensajesEsquemaConSender.find({ 'mail': mail }).lean().exec()
    await mensajesConSenderEsquema.find({ 'mail': mail }, { '_id': 0 }).sort({ 'date': -1 }).exec()
        .then((doc) => {
            const cant = doc.length;
            console.log(`Cantidad de elementos ${cant}`);
            if (cant == 0) {
                console.log('no se encontró ese mail');
                res.status(409).json(`No se encontró ese mail en la db`);
                return;
            } else {
                // let data = [];
                // doc.forEach(element => {
                //     data.push({
                //         title: element.title,
                //         bodyMessage: element.bodyMessage,
                //         iconImage: element.iconImage,
                //         date: element.date,
                //         category: element.category,
                //         status: element.status,
                //         auth: element.auth,
                //         mail: element.mail,
                //         senderDTO: {
                //             id: id,
                //             fullname: fullname,
                //             avatar: avatar,
                //             email: email
                //         }
                //     });
                // });
                res.status(200).json(doc);
            }
        })
        .catch((err) => {
            console.log(`Error al buscar el mail (find) en la bd`);
        })
}

module.exports = ctrlMsg;