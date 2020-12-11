//leer variables de entorno desde el archivo .dotenv-------------------
require('dotenv').config()
  
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

//------------------middleware-----------------------------------------
// app.set('trust proxy', true);
// proxy con la libreria cors:
// que el servidor escuche en todos los puertos: app.use(cors({}));
// Escuchar un puerto: app.use(cors({origin: 'http://localhost:4200'}));
// app.use(cors({origin :'http://localhost:3000/subscription'}));
app.use(cors());
// Configurar cabeceras y cors
//---------------------------------------------------------------------
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//        res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
//        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//        res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
//   next();
// });

app.use(morgan('dev')); //ver por consola las peticiones que llegan al server
app.use(express.urlencoded({ extended: false }));  //decodif. los datos que llegan desde un form
app.use(express.json()); //convertir los datos que llegan del front de peticiones http a json
app.use(require('express-useragent').express());

//Routes
app.use(require('./routes/index.js'));

//static content
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------------------------
// conectarse a la base de datos mongo
// --------------------------------------------------------------------
//const mongoDB = 'mongodb://localhost/msgpush';
//mongoose.connect(mongoDB, {useNewUrlParser : true});
//mongoose.Promise=global.Promise;
//const db = mongoose.connection;
//db.on('error',console.error.bind(console,'Mongo connection error: '));

//---------------------------------------------------------------------
// conexión 
//---------------------------------------------------------------------
mongoose.connect(process.env.uriRemota, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB Connected…');
    const db = mongoose.connection;
  })
  .catch(err => console.log(err));

// --------------------------------------------------------------------
// ----> Pagina de administ. del servidor -----------------------------
// --------------------------------------------------------------------
app.set('view engine', 'hbs');

// app.get('/'), (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// };
//const controlador = require('./routes/index.js')

// app.get('/', (req, res)=>{
//   res.render(
//     'template', 
//     { mensaje : 'hola mundo'}
//   );
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Escuchando en el puerto.. > ${PORT}`);
});
