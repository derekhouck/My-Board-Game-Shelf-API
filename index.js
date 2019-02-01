'use strict';

const express = require('express');

const { PORT } = require('./config');

const app = express();

app.use(express.static('public'));

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
  runServer();
}

module.exports = app;