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

//** connect with MongoDB Cloud */
// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

//** */ connect with local mongoDB
const DB = process.env.DATABASE_LOCAL;

// connect returns promise
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
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

// Sigterm signal for Heroku
// for testing, in terminal, heroku ps, heroku ps:restart (it will show 'done'), heroku logs --tail
process.on('SIGTERM', () => {
  console.log('Sigterm received. Shutting doune gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
