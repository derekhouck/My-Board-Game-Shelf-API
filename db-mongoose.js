const mongoose = require('mongoose');
const { DATABASE_URL } = require('./config');

const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

mongoose.Promise = global.Promise;

function dbConnect(url = DATABASE_URL) {
  return mongoose.connect(url, mongooseOptions)
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error('Mongoose failed to connect');
      // eslint-disable-next-line no-console
      console.error(err);
    });
}

function dbDisconnect() {
  return mongoose.disconnect();
}

function dbDrop() {
  return mongoose.connection.db.dropDatabase();
}

module.exports = {
  dbConnect,
  dbDisconnect,
  dbDrop
};