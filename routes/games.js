'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Game = require('../models/game');
const Tag = require('../models/tag');

const isValidId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  } else {
    next();
  }
};

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

const validateTagIds = (tags, userId) => {
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
        _id: { $in: tags },
        userId
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

const router = express.Router();

// GET /api/games
router.get('/', (req, res, next) => {
  const { searchTerm, players, tagId } = req.query;
  const userId = req.user.id;

  let filter = { userId };

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
    .sort({ title: 'asc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

// GET /api/games/:id
router.get('/:id', isValidId, (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Game.findOne({ _id: id, userId })
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
router.post('/', validatePlayers, (req, res, next) => {
  const { title, minPlayers, maxPlayers, tags } = req.body;
  const userId = req.user.id;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newGame = {
    title,
    players: {
      min: minPlayers,
      max: maxPlayers
    },
    tags,
    userId
  };

  validateTagIds(newGame.tags, userId)
    .then(() => Game.create(newGame))
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

// PUT /api/games/:id
router.put('/:id',
  isValidId,
  validatePlayers,
  (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    const toUpdate = {};
    const updateableFields = ['title', 'minPlayers', 'maxPlayers', 'tags'];

    updateableFields.forEach(field => {
      if ((field === 'minPlayers') || (field === 'maxPlayers')) {
        toUpdate.players = Object.assign({}, toUpdate.players);
        field === 'minPlayers' ? toUpdate.players.min = req.body[field] : toUpdate.players.max = req.body[field];
      } else if (field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });

    if (toUpdate.title === '') {
      const err = new Error('Missing `title` in request body');
      err.status = 400;
      return next(err);
    }

    Game
      .findOneAndUpdate({ _id: id, userId }, toUpdate, { new: true })
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

module.exports = router;