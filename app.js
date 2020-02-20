const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//// 1) MIDDLEWARE
app.use(morgan('dev'));

//// using middleware - modify the incoming data - app uses that middleware
app.use(express.json());

//// middleware function
//// argumnets are the ones that you want to add to middleware stack - morgan
//// this applied to every single request
app.use((req, res, next) => {
  console.log('Hello from the middleware!');
  next();
})

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next()
})

//Mounting router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
