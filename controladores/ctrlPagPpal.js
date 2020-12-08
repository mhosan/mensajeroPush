const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');
const mensajesEsquemaSender = require('../modelos/msgSender');
const categoriasEsquema = require('../modelos/category');
const ctrlPagPpal = {};


//get subscripciones
ctrlPagPpal.getSubscripciones = async (req, res) => {
    let jsonSuscrip = [];
    let jsonMsg = [];
    let jsonCat = [];
    suscripcionesEsquema.find().exec()  //<--leer subscripciones
        .then((suscrip) => {
            suscrip.forEach(element => {
                let fechaMongo = new Date(element.fechaAlta);
                fechaLocal = fechaMongo.toLocaleString('es-ES');
                let correo = element.mail;
                if (typeof (correo) === 'undefined') {
                    correo = "---> sin correo <---"
                } else {
                    correo = element.mail;
                }
                //console.log(`correo: ${correo}`);
                const elementoJson = {
                    keyAuth: element.keys.auth,
                    fechaAlta: fechaLocal,
                    mail: correo
                };
                jsonSuscrip.push(elementoJson);
            });

            //buscar la categoria a partir del idcat
            // let categoriaTexto = "";
            // const idCategoria = itemMensaje.category;
            // categoriasEsquema.find({ 'catIndex': idCategoria })
            //     .then((doc) => {
            //         categoriaTexto = doc[0].catLabel;
            //     })
            //     .catch((err) => {
            //         console.log('error en el find que busca la categoria');
            //     });
            //mensajesEsquemaSender.find().sort({ 'date': -1 }).exec()  //<--leer todos los mensajes
            mensajesEsquemaSender.find().sort({ 'date': -1 }).exec()  //<--leer todos los mensajes
                .then((msgs) => {
                    msgs.forEach(itemMensaje => {
                        let fechaMsg = new Date(itemMensaje.date);
                        fechaMsgLocal = fechaMsg.toLocaleString('es-AR');
                        const cat = asignarCategoria(itemMensaje.category);
                        const elementoMsgJson = {
                            title: itemMensaje.title,
                            bodyMessage: itemMensaje.bodyMessage,
                            iconImage: itemMensaje.iconImage,
                            date: fechaMsgLocal,
                            category: cat,//itemMensaje.category,
                            status: itemMensaje.status,
                            auth: itemMensaje.auth,
                            mail: itemMensaje.mail,
                            senderDTO: {
                                id: itemMensaje.senderDTO.id,
                                fullname: itemMensaje.senderDTO.fullname,
                                avatar: itemMensaje.senderDTO.avatar,
                                email: itemMensaje.senderDTO.email
                            }
                        };
                        jsonMsg.push(elementoMsgJson);
                    })
                    categoriasEsquema.find().exec()
                        .then((doc) => {
                            doc.forEach(element => {
                                const elementoCategoria = {
                                    catIndex: element.catIndex,
                                    catLabel: element.catLabel,
                                    catDescrip: element.catDescrip
                                };
                                jsonCat.push(elementoCategoria);
                            });
                            res.render('template', { suscriptos: jsonSuscrip, mensajes: jsonMsg, category: jsonCat });
                        })
                        .catch((err) => {
                            console.log('error en el find de categorias', err);
                        })


                })
                .catch((err) => {
                    console.log(`Error en el find de mensajes: ${err}`);
                });
        })
        .catch((err) => {
            console.log(`Error en el find de suscrip: ${err}`);
        });
}

function asignarCategoria(item) {
    const categorias = {
        1: 'Sistema',
        2: 'Pages',
        3: 'Tarjeta',
        4: 'Creditos',
        5: 'Remates'
    }
    switch (item) {
        case item = 1:
            categoria = categorias[1];
            break;
        case item = 2:
            categoria = categorias[2];
            break;
        case item = 3:
            categoria = categorias[3];
            break;
        case item = 4:
            categoria = categorias[4];
            break;
        case item = 5:
            categoria = categorias[5];
            break;
        default:
            categoria = "-";
    }
    return categoria
}


module.exports = ctrlPagPpal;