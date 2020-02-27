const mongoose = require('mongoose');
const dotenv = require('dotenv');
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
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
