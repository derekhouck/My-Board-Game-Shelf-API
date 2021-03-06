const express = require('express');
const passport = require('passport');

const User = require('../models/user');
const Game = require('../models/game');

const {
  isFieldValidId, isValidId, requiredFields, requiresAdmin
} = require('./validators');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

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

const createDupKeyErr = err => {
  const regex = /index\:\ (?:.*\.)?\$?(?:([_a-z0-9]*)(?:_\d*)|([_a-z0-9]*))\s*dup key/i,
    match = err.message.match(regex),
    indexName = match[1] || match[2];
  err = new Error(`${indexName} already exists`);
  err.status = 422;
  err.reason = 'ValidationError';
  err.location = indexName;
  return err;
}

const validateEmail = (req, res, next) => {
  const emailIsValid = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const { email } = req.body;
  const invalidEmail = email && !emailIsValid(email);
  if (invalidEmail) {
    const err = new Error('Invalid email');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = 'email';
    return next(err);
  }
  return next();
};

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

// POST /api/users
router.post('/',
  validateEmail,
  validateStringFields,
  validateTrimmedFields,
  validateFieldSizes,
  createDigest,
  (req, res, next) => {
    const requiredFields = ['email', 'password', 'username'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
      const err = new Error('Missing field');
      err.status = 422;
      err.reason = 'ValidationError';
      err.location = missingField;
      return next(err);
    }

    let { digest, email, name = '', username } = req.body;

    name = name.trim();

    return User
      .create({
        email,
        name,
        password: digest,
        username,
      })
      .then(user => {
        return res.status(201).json(user);
      })
      .catch(err => {
        if (err.code === 11000) {
          err = createDupKeyErr(err);
        }
        next(err);
      });
  });

router.post('/:id/games',
  jwtAuth,
  requiredFields('gameId'),
  isFieldValidId('gameId'),
  (req, res, next) => {
    const { gameId } = req.body;
    const userId = req.user.id;

    return Game.findById(gameId)
      .then(game => {
        if (game) {
          return User.findByIdAndUpdate(userId, {
            $push: { "games": gameId }
          }, { new: true })
        } else {
          return next();
        }
      })
      .then(user => Game.find({ _id: { $in: user.games } }))
      .then(games => res.json(games))
      .catch(err => next(err));
  });

// GET /api/users
router.get('/',
  jwtAuth,
  requiresAdmin,
  (req, res, next) =>
    User
      .find()
      .then(users => res.json(users))
      .catch(err => next(err))
);

router.get('/:id', isValidId, (req, res, next) => {
  const { id } = req.params;

  return User
    .findOne({ _id: id })
    .then(user => user ? res.json(user) : next())
    .catch(err => next(err));
});

router.get('/:id/games', jwtAuth, (req, res, next) => {
  const { searchTerm, players, tagId } = req.query;
  const userId = req.user.id;
  let gameGames;

  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = re;
  }

  if (players) {
    filter['players.min'] = { $lte: players };
    filter['players.max'] = { $gte: players };
  }

  if (tagId) {
    filter.tags = tagId;
  }

  return User.findById(userId)
    .then(user => {
      filter['_id'] = { $in: user.games };
      return Game.find(filter)
        .populate('tags')
        .sort({ title: 'asc' });
    })
    .then(userGames => res.json(userGames))
    .catch(err => next(err));
});

// PUT /api/users/:id
router.put('/:id',
  jwtAuth,
  isValidId,
  validateEmail,
  validateStringFields,
  validateTrimmedFields,
  validateFieldSizes,
  createDigest,
  (req, res, next) => {
    const { id } = req.params;

    const toUpdate = {};
    const updateableFields = ['admin', 'digest', 'email', 'name', 'username'];

    updateableFields.forEach(field => {
      if (field in req.body) {
        switch (field) {
          case 'admin':
            if (!req.user.admin) {
              const err = new Error('Unauthorized');
              err.status = 401;
              next(err);
            }
            return toUpdate[field] = req.body[field];
          case 'digest':
            return toUpdate['password'] = req.body[field];
          case 'name':
            return toUpdate[field] = req.body[field].trim();
          default:
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
          err = createDupKeyErr(err);
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

router.delete('/:id/games',
  jwtAuth,
  requiredFields('gameId'),
  isFieldValidId('gameId'),
  (req, res, next) => {
    const { gameId } = req.body;
    const userId = req.user.id;
    return User.findByIdAndUpdate(userId, {
      $pull: { "games": gameId }
    }, { new: true })
      .then(user => {
        return Game.find({ _id: { $in: user.games } })
      })
      .then(games => res.json(games))
      .catch(err => next(err));
  });

module.exports = router;