const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
const route = require('./database.js');
const PORT = 8080


var corsOptions = {
  origin: ['http://localhost:4200','http://localhost:8080','http://localhost:9200','http://localhost:8080/api','http://localhost:9200/customer/cus_info'],
  allowedHeaders: ["Access-Control-Allow-Headers", "Origin, X-Requested-With, X-location, Content-Type, Accept, Cache-Control"],
  methods: 'GET,POST',
  preflightContinue: false,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.options('*', cors(corsOptions)) // include before other routes

app.use(cors(corsOptions)) // include before other routes

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

app.use(express.json());

app.use('/api', route);
  
app.get('/', (req, res) => res.send('Hello World! This is Max!!!'));
  
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`))