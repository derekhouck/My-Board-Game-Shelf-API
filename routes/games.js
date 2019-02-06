'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Game = require('../models/game');

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
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

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
router.post('/', (req, res, next) => {
  const { title, minPlayers, maxPlayers } = req.body;
  const userId = req.user.id;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

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

  isNumber(minPlayers);
  isNumber(maxPlayers);

  const newGame = { 
    title, 
    players: {
      min: minPlayers,
      max: maxPlayers
    },
    userId 
  };

  Game.create(newGame)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

module.exports =router;