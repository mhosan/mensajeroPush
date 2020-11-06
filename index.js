require('dotenv').config()  //leer las variables desde el sist op.
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
//middleware

app.use(morgan('dev')); //ver por consola las peticiones que llegan al server
app.use(express.urlencoded({extended: false}));  //decodif. los datos que llegan desde un form
app.use(express.json()); //convertir los datos que llegan del front de peticiones http a json

//Routes
app.use(require('./routes/index.js'));

//static content
app.use(express.static(path.join(__dirname, 'public')));

// ----> Proxy --------------------------------------------------------
// que el servidor escuche en todos los puertos: app.use(cors({}));
// Escuchar un puerto: app.use(cors({origin: 'http://localhost:4200'}));
//app.use(cors({origin :'http://localhost:3000/subscription'}));
//app.use(cors());
// Configurar cabeceras y cors
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//     res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
//     next();
// });
//http://localhost:3000/subscription
// --------------------------------------------------------------------
// ----> Seteo de view engine -----------------------------------------
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'hbs');

// --------------------------------------------------------------------
// ----> Pagina de administ. del servidor mmo -------------------------
// magia pura: en lugar de setear una view engine y usar routes, con el
// archivo routes/index.html, cuando se pide la ruta raiz del sitio se
// envia directamente una pagina estática con la lib. socket.io 
app.get('/'), (req, res) => {
    res.sendFile(__dirname + '/index.html');
};

//usar el puerto que me asigne el hosting y si no utilizar el 3000
const PORT = process.env.PORT || 3000;

//Listen for incoming connections
app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Escuchando en el puerto.. > ${PORT}`);
});
