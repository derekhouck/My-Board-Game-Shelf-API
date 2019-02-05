'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');

const router = express.Router();

const localAuth = passport.authenticate('local', { session: false, failWithError: true });
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

function createAuthToken(user) {
  const token = jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
  return token;
}

router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;