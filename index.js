'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');

const { PORT, CLIENT_ORIGIN } = require('./config');
const { dbConnect } = require('./db-mongoose');
const localStrategy = require('./passport/local');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const app = express();

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: () => process.env.NODE_ENV === 'test'
  })
);

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use(express.static('public'));

// Parse request body
app.use(express.json());

// Utilize the given `strategy`
passport.use(localStrategy);

// Mount routers
app.use('/api/users', usersRouter);
app.use('/api', authRouter);

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Custom Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

function runServer(port = PORT) {
  const server = app
    .listen(port, () => {
      // eslint-disable-next-line no-console
      console.info(`App listening on port ${server.address().port}`);
    })
    .on('error', err => {
      // eslint-disable-next-line no-console
      console.error('Express failed to start');
      // eslint-disable-next-line no-console
      console.error(err);
    });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = app;