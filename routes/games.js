'use strict';

const express = require('express');

const Game = require('../models/game');

const router = express.Router();

// GET /api/games
router.get('/', (req, res, next) => {
  const userId = req.user.id;

  let filter = { userId };

  Game.find(filter)
    .then(results => res.json(results))
    .catch(err => next(err));
});

module.exports =router;