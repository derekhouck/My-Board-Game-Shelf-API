const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Game = require('../models/game');
const Tag = require('../models/tag');
const User = require('../models/user');

const {
  isValidId, requiredFields, requiresAdmin
} = require('./validators');

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });
const router = express.Router();

const validatePlayers = (req, res, next) => {
  const { minPlayers, maxPlayers } = req.body;
  const fields = ['minPlayers', 'maxPlayers'];
  const filteredFields = fields.filter(field => field in req.body);
  if (filteredFields.length > 0) {
    const isNumber = num => {
      if (num === undefined || num === '') {
        return;
      }

      if (!Number(num)) {
        const err = new Error('`minPlayers` and `maxPlayers` should be numbers');
        err.status = 400;
        return next(err);
      }
    };
    filteredFields.forEach(field => {
      isNumber(req.body[field]);
    });
  }

  if (maxPlayers < minPlayers) {
    const err = new Error('`maxPlayers` should not be less than `minPlayers`');
    err.status = 400;
    return next(err);
  }

  return next();
};

const validateTagIds = tags => {
  if (tags === undefined) {
    return Promise.resolve();
  }

  if (!Array.isArray(tags)) {
    const err = new Error('The `tags` property must be an array');
    err.status = 400;
    return Promise.reject(err);
  }

  const badIds = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
  if (badIds.length) {
    const err = new Error('The `tags` array contains an invalid `id`');
    err.status = 400;
    return Promise.reject(err);
  }

  return Tag.countDocuments({
    $and: [
      {
        _id: { $in: tags }
      }
    ]
  })
    .then(count => {
      if (tags.length > count) {
        const err = new Error('The `tags` array contains an invalid `id`');
        err.status = 400;
        return Promise.reject(err);
      }
    });
};


// GET /api/games
router.get('/', (req, res, next) => {
  const { searchTerm, players, tagId } = req.query;

  let filter = {
    status: 'approved'
  };

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

  Game.find(filter)
    .populate('tags')
    .sort({ title: 'asc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

// GET /api/games/:id
router.get('/:id', jwtAuth, isValidId, (req, res, next) => {
  const { id } = req.params;

  Game.findById(id)
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// POST /api/games
router.post('/',
  jwtAuth,
  validatePlayers,
  requiredFields('title'),
  (req, res, next) => {
    const { title, minPlayers, maxPlayers, tags } = req.body;
    const userId = req.user.id;
    let createdGame;

    const gameInfo = {
      title,
      players: {
        min: minPlayers,
        max: maxPlayers
      },
      tags,
      userId
    };

    validateTagIds(gameInfo.tags)
      .then(() => Game.create(gameInfo))
      .then(game => {
        createdGame = game;
        return User.findByIdAndUpdate(userId, {
          $push: { "games": game.id }
        }, { new: true });
      })
      .then(result => {
        res.location(`${req.originalUrl}/${createdGame.id}`).status(201).json(createdGame);
      })
      .catch(err => next(err));
  });

// PUT /api/games/:id
router.put('/:id',
  jwtAuth,
  requiresAdmin,
  isValidId,
  validatePlayers,
  (req, res, next) => {
    const { id } = req.params;

    const toUpdate = {};
    const updateableFields = ['minPlayers', 'maxPlayers', 'status', 'tags', 'title'];

    updateableFields.forEach(field => {
      if ((field === 'minPlayers') || (field === 'maxPlayers')) {
        toUpdate.players = Object.assign({}, toUpdate.players);
        field === 'minPlayers' ? toUpdate.players.min = req.body[field] : toUpdate.players.max = req.body[field];
      } else if (field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });

    if (toUpdate.status && (toUpdate.status !== 'approved' && toUpdate.status !== 'rejected')) {
      const err = new Error('That is not a valid status');
      err.status = 400;
      return next(err);
    }

    if (toUpdate.title === '') {
      const err = new Error('Missing `title` in request body');
      err.status = 400;
      return next(err);
    }

    validateTagIds(toUpdate.tags)
      .then(() => {
        return Game
          .findByIdAndUpdate(id, toUpdate, { new: true })
          .populate('tags');
      })
      .then(result => {
        if (result) {
          res.json(result);
        } else {
          next();
        }
      })
      .catch(err => next(err));
  });

// DELETE /api/games/:id
router.delete('/:id',
  jwtAuth,
  requiresAdmin,
  isValidId,
  (req, res, next) => {
    const { id } = req.params;

    Game.findOneAndDelete({ _id: id })
      .then(() => res.sendStatus(204))
      .catch(err => next(err));
  });

module.exports = router;