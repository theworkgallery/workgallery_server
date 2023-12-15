const allowedOrigins = require('./allowedOrigins');
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // origin in allowed origin  || no origin //TODO:Remove no origin field in production
      callback(null, true); //error, allowed
    } else {
      callback(new Error('Not allowed by CORS.'));
    }
  },
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
