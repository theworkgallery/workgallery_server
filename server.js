require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3500;
const App = express();
const cors = require('cors');
const { reqLogger } = require('./middleware/eventLogger');
const corsOptions = require('./config/corsOptions');
const errorHandler = require('./middleware/errorHandler');
const credentials = require('./middleware/credentials');
const dbConnection = require('./config/dbConn');

//connect to db
dbConnection();
//custom middle ware for req logging
App.use(reqLogger);

//handle credentials before cors

App.use(credentials); //this is a preflight request handler it should be before cors .if not used cors throws error rew.header is not set
//cors
App.use(cors(corsOptions));
//for handling url encoded data and content-Type:application/www-form-urlencoded
App.use(express.urlencoded({ extended: false }));
//middle ware for handling json data
App.use(express.json());

App.use('/', require('./routes/api/v1/waitListRoute'));
App.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('json')) {
    res.status(404).json({ error: 'File not found' });
  } else {
    res.send('File not found ');
  }
});

//custom error handler

App.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to Db');
  App.listen(PORT, () => {
    console.log(`App Listening on ${PORT}`);
  });
});
