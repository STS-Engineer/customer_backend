const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');



const customerrouter = require('./services/customer');

const app = express();


// ✅ CORS config FIRST
app.use(cors({
  origin: ['http://localhost:3000'], // add your frontend origin
  credentials: true
}));

// ✅ Handle preflight requests explicitly
app.options(/.*/, (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});


// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// Routes
app.use('/ajouter', customerrouter);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
