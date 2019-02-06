'use strict';

const express = require('express');

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

  Game.findOne({ _id: id, userId })
    .then(result => res.json(result))
    .catch(err => next(err));
});

module.exports =router;