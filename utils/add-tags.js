'use strict';

const mongoose = require('mongoose');

const { DATABASE_URL } = require('../config');

const Tag = require('../models/tag');

const { tags } = require('../db/tags');

console.log(`Connecting to mongodb at ${DATABASE_URL}`);
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useCreateIndex : true })
  .then(() => {
    console.info('Adding Tags');
    return Promise.all([
      Tag.insertMany(tags),
      Tag.createIndexes()
    ]);
  })
  .then(results => {
    console.log('Inserted', results);
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });