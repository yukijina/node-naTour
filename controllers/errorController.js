const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Duplicate Error when you create a duplicate data
const handleDuplicateFieldDB = err => {
  // errmsg is from mongo error (you can see by inputting duplicate)
  // get specific error messageg from errmsg. We use regext. Take string between double quotes.
  // errmsg looks like this:
  //"errmsg": "E11000 duplicate key error collection: naTours.tours index: name_1 dup key: { name: \"Testing tour 992\" }",
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}: Please use another value `;
  return new AppError(message, 400);
};

// make one string for all validation errors (error text is created in shchema)
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
  // a) api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // b) Rendered website
  console.error('Error: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted errorL send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message
      });
      // Programming or other unknowing error. We don not want to let users know.
    }
    // b) Rendered website
    // 1) Log the error
    console.error('Error: ', err);

    // 2) Send general message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
  // b) Rendered website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // It is not good practice to change the original err message, so we copy to error
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
