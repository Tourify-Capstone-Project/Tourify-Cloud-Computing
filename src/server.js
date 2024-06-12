const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes/routes');
const dbConnect = require('./config/database-config');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

//================================================================================================================

app.use(cors({
  credentials: true, // To send a request from the front-end along with a cookie with credentials
  origin: '*', // URLs or Endpoints that can access this API
}));

// Parsing body
app.use(express.urlencoded({ extended: false }));
// Parsing JSON
app.use(express.json());
app.use(bodyParser.json());
// Trust proxy
app.set('trust proxy', true);
// Set view engine
app.set('view engine', 'ejs');

// Set routes
app.use('/', routes);

app.get('/', (req, res) => {
  res.send('Hi, This is Tourify API!');
});

// Ensure database are connected 
dbConnect.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database successfully!');
});

// Run Server
const host = 'localhost';
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://${host}:${PORT}`);
});