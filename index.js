require('dotenv').config();
const Arena = require('bull-arena');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');

const { PORT, CORS_WHITELIST, REDIS_URL } = require('./config');
const { dbConnect } = require('./db-mongoose');
const { UPDATE_SHELVES, createQueues } = require('./queues');
const localStrategy = require('./passport/local');
const jwtStrategy = require('./passport/jwt');

const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const gamesRouter = require('./routes/games');
const tagsRouter = require('./routes/tags');
const usersRouter = require('./routes/users');
const { requiresAdmin } = require('./routes/validators');

const app = express();

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: () => process.env.NODE_ENV === 'test'
  })
);


app.use(
  cors({
    origin: function (origin, callback) {
      if (CORS_WHITELIST.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);


// Utilize the given `strategy`
passport.use(localStrategy);
passport.use(jwtStrategy);

// Protect endpoints using JWT Strategy
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

// Queues GUI
app.use('/arena', Arena(
  {
    queues: [
      {
        name: UPDATE_SHELVES,
        hostId: 'Games',
        redis: REDIS_URL
      }
    ]
  },
  {
    basePath: '/',
    disableListen: true
  }
));

app.use(express.static('public'));

// Parse request body
app.use(express.json());

// Mount routers
app.use('/api/admin', jwtAuth, requiresAdmin, adminRouter);
app.use('/api/games', gamesRouter);
app.use('/api/tags', jwtAuth, tagsRouter);
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
  createQueues();
}

module.exports = app;