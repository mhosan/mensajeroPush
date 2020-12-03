const { Router } = require('express');  //traer una parte de express
const router = Router();
const mongoose = require('mongoose');
const webpush = require('../webpush');
var Schema = mongoose.Schema;
const suscripcionesEsquema = require('../modelos/subsc');
const mensajesEsquema = require('../modelos/msg');
const categoriasEsquema = require('../modelos/category');
const ctrlSubsc = require('../controladores/ctrlSubsc');
const ctrlPagPpal = require('../controladores/ctrlPagPpal');
const ctrlSubscripciones = require('../controladores/ctrlSubsc');
const ctrlMsg = require('../controladores/ctrlMsg');

let pushSubscription;
let subscripcionDestino;

//---------------------------------------------------------------------
// pagina principal de adm del servidor. Esta página probablemente 
// desaparezca
//---------------------------------------------------------------------
router.get('/', ctrlPagPpal.getSubscripciones);

//---------------------------------------------------------------------
// recibiendo (y persistiendo) subscripción
//---------------------------------------------------------------------
router.post('/subscription', ctrlSubscripciones.postSubscripcion);

//---------------------------------------------------------------------
// recibiendo y actualizando la subscripción. Se le agregan datos para
// identificar al usuario, por ahora es el mail.
//---------------------------------------------------------------------
router.put('/', ctrlSubscripciones.putSubscripcion);

//---------------------------------------------------------------------
// listar todas las subscripciones
//---------------------------------------------------------------------
router.get('/subscripciones', ctrlSubsc.getSubscripciones);

//---------------------------------------------------------------------
// borrar suscripcion. se recibe como param el codigo auth
// OJO, esto se ejecuta desde una llamada request a esta API
//---------------------------------------------------------------------
router.delete('/delete/:auth', ctrlSubscripciones.deleteSubscripcion);

//---------------------------------------------------------------------
// borrar suscripcion. se recibe como param el codigo auth
// OJO, esto se ejecuta desde el código main en el cliente!. NO es una
// llamada API request
//---------------------------------------------------------------------
router.put('/borrar', ctrlSubscripciones.borrarSubscripcion);

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
router.post('/new-message', ctrlMsg.newMessage);

//---------------------------------------------------------------------
// listar notificaciones a partir de un mail
// { 'mail' : 'algo@gmail.com'}
//---------------------------------------------------------------------
router.get('/listado/:mail', ctrlMsg.listarNotificaciones);

module.exports = router;

