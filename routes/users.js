'use strict';

const express = require('express');
const passport = require('passport');

const User = require('../models/user');
const Game = require('../models/game');

const { isValidId } = require('./validators');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

// POST /api/users
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

  const stringFields = ['username', 'password', 'name'];
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

  // If the username and password aren't trimmed we give an error.  Users might
  // expect that these will work without trimming (i.e. they want the password
  // "foobar ", including the space at the end).  We need to reject such values
  // explicitly so the users know what's happening, rather than silently
  // trimming them and expecting the user to understand.
  // We'll silently trim the other fields, because they aren't credentials used
  // to log in, so it's less of a problem.
  const explicitlyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error('Cannot start or end with whitespace');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = nonTrimmedField;
    return next(err);
  }

  const sizedFields = {
    username: { min: 1 },
    password: { min: 8, max: 72 }
  };

  const tooSmallField = Object.keys(sizedFields).find(
    field => 'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );

  const tooLargeField = Object.keys(sizedFields).find(
    field => 'max' in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    const num = tooSmallField ? sizedFields[tooSmallField].min : sizedFields[tooLargeField].max;
    const err = new Error('');
    err.status = 422;
    err.reason = 'ValidationError';
    err.message = `Must be at ${tooSmallField ? 'least' : 'most'} ${num} characters long`;
    err.location = tooSmallField || tooLargeField;
    return next(err);
  }

  let { username, password, name = '' } = req.body;
  name = name.trim();

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
      if (err.code === 11000) {
        err = new Error('Username already taken');
        err.status = 422;
        err.reason = 'ValidationError';
        err.location = 'username';
      }
      next(err);
    });
});

// GET /api/users
router.get('/', jwtAuth, (req, res, next) => {
  return User
    .find()
    .then(users => res.json(users))
    .catch(err => next(err));
});

// PUT /api/users/:id
router.put('/:id', (req, res, next) => {
  const { id } = req.params;

  const toUpdate = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  return User.findOneAndUpdate({ _id: id }, toUpdate, { new: true })
    .then(result => res.json(result))
    .catch(err => next(err));
});

// DELETE /api/users/:id
router.delete('/:id', jwtAuth, isValidId, (req, res, next) => {
  const { id } = req.params;

  if (id !== req.user.id) {
    const err = new Error('You cannot delete another user\'s account');
    err.status = 400;
    return next(err);
  }

  const userRemovePromise = User.findOneAndDelete({ _id: id });
  const gamesRemovePromise = Game.deleteMany({ userId: id });

  Promise.all([userRemovePromise, gamesRemovePromise])
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;