const express = require('express');

const Game = require('../models/game');

const router = express.Router();

router.get('/games', (req, res, next) => {
  const { players, searchTerm, tagId } = req.query;

  const filter = {};

  if (players) {
    filter['players.min'] = { $lte: players };
    filter['players.max'] = { $gte: players };
  }

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = re;
  }

  if (tagId) { filter.tags = tagId; }

  return Game.find(filter)
    .sort({ title: 'asc' })
    .then(games => res.json(games))
    .catch(err => next(err));
});

module.exports = router;