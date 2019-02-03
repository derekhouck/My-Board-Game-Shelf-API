'use strict';

const express = require('express');

const User = require('../models/user');

const router = express.Router();

router.post('/', (req, res, next) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error('Missing field');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = missingField;
    return next(err);
  }

  const stringFields = ['username'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    const err = new Error('Incorrect field type: expected string');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = nonStringField;
    return next(err);
  }

  let { username, password, name } = req.body;

  return User
    .hashPassword(password)
    .then(digest => {
      return User.create({
        username,
        password: digest,
        name
      });
    })
    .then(user => {
      return res.status(201).json(user);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;