const webpush = require('web-push');
//ver la doc de web-push por generación de claves: https://www.npmjs.com/package/web-push
//para generar las claves ejecutar en la terminal:
//
//  npx web-push generate-vapid-keys
//
//esto genera una llave publica y una llave privada

//console.log(process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY);

webpush.setVapidDetails(
    'mailto: maylygibbs807@gmail.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

module.exports = webpush;