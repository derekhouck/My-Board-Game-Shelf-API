const express = require('express');
const passport = require('passport');

const User = require('../models/user');
const Game = require('../models/game');

const { isValidId } = require('./validators');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

const validateStringFields = (req, res, next) => {
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
  } else {
    return next();
  }
};

const validateTrimmedFields = (req, res, next) => {
  const explicitlyTrimmedFields = ['username', 'password'];
  const fieldsToTest = explicitlyTrimmedFields.filter(field => field in req.body);
  const nonTrimmedField = fieldsToTest.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error('Cannot start or end with whitespace');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = nonTrimmedField;
    return next(err);
  } else {
    return next();
  }
};

const validateFieldSizes = (req, res, next) => {
  const sizedFields = {
    username: { min: 1 },
    password: { min: 8, max: 72 }
  };

  const objToTest = {};
  Object.keys(sizedFields).forEach(field => {
    if (field in req.body) {
      objToTest[field] = sizedFields[field];
    }
  });

  const tooSmallField = Object.keys(objToTest).find(
    field => 'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );

  const tooLargeField = Object.keys(objToTest).find(
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
  } else {
    return next();
  }
};

const createDigest = (req, res, next) => {
  const { password } = req.body;
  if (password) {
    User.hashPassword(password)
      .then(digest => {
        req.body.digest = digest;
        return next();
      });
  } else {
    return next();
  }
};

// POST /api/users
router.post('/',
  validateStringFields,
  validateTrimmedFields,
  validateFieldSizes,
  createDigest,
  (req, res, next) => {
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
      const err = new Error('Missing field');
      err.status = 422;
      err.reason = 'ValidationError';
      err.location = missingField;
      return next(err);
    }

    let { digest, username, name = '' } = req.body;
    name = name.trim();

    return User
      .create({
        username,
        password: digest,
        name
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
  if (!req.user.admin) {
    const err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }

  return User
    .find()
    .then(users => res.json(users))
    .catch(err => next(err));
});

// PUT /api/users/:id
router.put('/:id',
  isValidId,
  validateStringFields,
  validateTrimmedFields,
  validateFieldSizes,
  createDigest,
  (req, res, next) => {
    const { id } = req.params;

    const toUpdate = {};
    const updateableFields = ['admin', 'digest', 'name', 'username'];

    updateableFields.forEach(field => {
      if (field in req.body) {
        if (field === 'digest') {
          return toUpdate['password'] = req.body[field];
        } else if (field === 'name') {
          return toUpdate[field] = req.body[field].trim();
        } else {
          return toUpdate[field] = req.body[field];
        }
      }
    });

    return User.findOneAndUpdate({ _id: id }, toUpdate, { new: true })
      .then(result => {
        result ? res.json(result) : next();
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