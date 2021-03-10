const path = require('path');
const express = require('express');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//// GLOBAL MIDDLEWARE
// SET SECURITY HEADERS - extra hedder keys are added for security
app.use(helmet());

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// RATE LIMIT
const limiter = ratelimit({
  //100 times attempt for one hour (if application needs a lot of API attempts, you should change this number)
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.'
});

// all api routes
app.use('/api', limiter);

//// BODY PARSER, reading data from req.body - modify the incoming data - app uses that middleware
app.use(express.json({ limit: '10kb' })); //jsondata accept upto 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //get login input form data
app.use(cookieParser());

// Data sanitation against NoSQL Query injection
app.use(mongoSanitize());

// Data sanitation against XSS
app.use(xss());

// Prevent parameter pollution => if hacker input sort=duration&sort=price, only last query is accepted(sort=price)
// However we use some of them twice so if only the last params is accepted, it won't return the right query. So we add to the whiteist
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// compress http requirest
app.use(compression());

//// Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

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
