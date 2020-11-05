const webpush = require('web-push');
//ver la doc de web-push por generación de claves: https://www.npmjs.com/package/web-push
//npx web-push generate-vapid-keys:

//console.log(process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY);

webpush.setVapidDetails(
    'mailto:mhosan@gmail.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

module.exports = webpush;