const PUBLIC_VAPID_KEY = 'BGWVb1Bj2YWYEaG23YsyW_IqSoz3ynLizo43Pzcfa7z1Snr3AMAOF_2BlL4SWb3n_5YLCicIFGONhoWuJ77ceXI';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const subscription = async () => {

    //service worker
    const register = await navigator.serviceWorker.register('./worker.js', {
        scope: '/'
    });
    console.log('new service worker');

    //este es el objeto que va a utilizar el servidor para comunicarse
    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    await fetch('/subscription', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    );
    console.log('subscripto correctamente!');
}

const form = document.querySelector('#miForm');
const message = document.querySelector('#message');

form.addEventListener('submit', e =>{
    e.preventDefault();
    fetch('/new-message', {
        method: 'POST',
        body: JSON.stringify({
            message: message.value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    form.reset(); 
});

subscription();