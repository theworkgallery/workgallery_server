const { eventLogger } = require('./eventLogger');

const errorHandler = (err, req, res, next) => {
  console.log('i have been called ');
  const statusCode = req.statusCode ? req.statusCode : 500;
  eventLogger(`${err.name} \t ${err.message}`, 'errLog.docx');
  console.log(err.message);
  console.log(err.stack);
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null, //show stack only in dev
  });
};

module.exports = errorHandler;
