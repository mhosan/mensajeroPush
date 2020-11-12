
const form = document.querySelector('#miForm');
const message = document.querySelector('#message');
const destinatario = document.querySelector('#selectId');

form.addEventListener('submit', e => {
    e.preventDefault();
    fetch('/new-message', {
        method: 'POST',
        body: JSON.stringify({
            message: message.value,
            destino: destinatario.value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    form.reset();
});

//$('#totalPush').html('Total de usuarios conectados:' + '987');

// $('#totalPush').html(
//     'Total de usuarios conectados:' +
//     '<div class="badge badge-primary text-wrap" style="width: 2rem;">' + (data.contador) + '</div><br>'
// );

//$('#listaPush').append('<li class="list-group-item" id="' + data.id + '"> Usuario: ' + data.nombre + ',  Id: ' + data.id + '</li>');
//$('#listaPush').append('<li class="list-group-item" id="' + 'Id:09894oo49' + '">Usuario: ' + 'Usuario nombre' + ',  Id: ' + 'Usuario id' + '</li>');

