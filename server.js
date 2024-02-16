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

//for handling cookies
App.use(cookieParser());
///api/v1/auth/oauth/google
App.use('/upload', require('./routes/api/v1/postRoutes'));

App.use('/server-status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
App.use('/api/v1/auth', require('./routes/api/v1/auth'));
App.use('/api/v1', require('./routes/api/v1/refresh'));

App.use(verifyJwt);
App.use('/api/v1/lobby', require('./routes/api/v1/lobbyRoutes'));
App.use('/api/v1/post', require('./routes/api/v1/postRoutes'));
App.use('/api/v1/gallery', require('./routes/api/v1/galleryRoutes'));
App.use('/api/v1/collections', require('./routes/api/v1/collectionRoutes'));
App.use('/api/v1/scrapping', require('./routes/api/v1/webScrappingRoutes'));
App.use('/api/v1/users', require('./routes/api/v1/userRoutes'));
App.use('/api/v1/profile', require('./routes/api/v1/profileRoutes'));

//custom error handler

App.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to Db');
  App.listen(PORT, () => {
    console.log(`App Listening on ${PORT}`);
  });
});
