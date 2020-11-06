
const form = document.querySelector('#miForm');
const message = document.querySelector('#message');

form.addEventListener('submit', e => {
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
