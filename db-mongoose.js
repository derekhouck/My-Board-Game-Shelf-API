'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { DATABASE_URL } = require('./config');

function dbConnect(url = DATABASE_URL) {
  return mongoose.connect(url, { useNewUrlParser: true })
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

function dbGet() {
  return mongoose;
}

function dbDrop() {
  return mongoose.connection.db.dropDatabase();
}

module.exports = {
  dbConnect,
  dbDisconnect,
  dbGet,
  dbDrop
};