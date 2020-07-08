const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//// 1) MIDDLEWARE
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//// using middleware - modify the incoming data - app uses that middleware
app.use(express.json());

app.use(express.static(`${__dirname}/public`));

//// middleware
//// this applied to every single request

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Mounting router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// HTTP handles all the routes
// Error handler for wrong routes - if the above mounting rounters run to the correct URL, this code never runs.
// However if ther is an error, this code runs. So it is important to write this code below  mounting routes.
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   staetus: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // });

  //reafactor using errorHandler
  // new Error - we can pass a string. that will be a err.message
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // By adding err in the next(), express knows that it is going to error handler
  //next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Express has error handling middleware
// always add with this order. (err, req, res, next)
app.use(globalErrorHandler);

module.exports = app;
