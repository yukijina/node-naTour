const mongoose = require('mongoose');
const dotenv = require('dotenv');

// This code should be here on top. Sync error  - The msg does NOT WORK - should fix later
process.on('uncoughtException', err => {
  console.log(err);
  console.log('UNCAUGHT. Shutting down...');
  console.log(err.name, err.message);
});

// config path - path is for the configuration file is located - read the file and save as environment variable
dotenv.config({ path: './config.env' });

// dotenv should be above app, so that app can read environment variable
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// connect returns promise
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// This code should be here on top. Sync error  - The msg does NOT WORK - should fix later
// database connection error - shut down serer
// In production, we need to restart server once it crushes. Coordinate with host.
process.on('unhandleRehection', err => {
  console.log('UNHANDLED REJECTION. Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
