const express = require('express');
const morgan = require('morgan');

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
  res.status(404).json({
    staetus: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

module.exports = app;
