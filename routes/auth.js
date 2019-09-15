'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

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

router.post('/hard-refresh', jwtAuth, (req, res, next) => {
  return User.find({ _id: req.user.id })
    .then(([user]) => {
      const authToken = createAuthToken({
        email: user.email,
        id: user.id,
        name: user.name,
        username: user.username
      });
      return res.json({ authToken });
    })
    .catch(err => next(err));
});

module.exports = router;