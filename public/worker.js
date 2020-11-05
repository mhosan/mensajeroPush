//el worker será el encargado de escuchar, por lo tanto el listener va aqui
console.log('Y aqui el service worker!!!');

self.addEventListener('push', e => {
    const data = e.data.json();
    console.log(data);
    self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/images/marcador.png'
    });
});