class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // extends from parents class
    console.log('here in Apperror');
    this.statusCode = statusCode;
    // startsWith in js takes string. We change statusCode to string and if it includes '4', returns fail. Or error.
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // this is useful in the future we can send errors to client only if this isOperational is true. We will have
    // other errors like bugs or programming but those won't be sent to the clients
    this.isOperational = true;
    // we can capture err.stack to constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
