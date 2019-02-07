'use strict';

const express = require('express');

const Tag = require('../models/tag');

const router = express.Router();

// GET /api/games
router.get('/', (req, res, next) => {
  const userId = req.user.id;

  Tag.find({ userId })
    .sort({ name: 'asc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

module.exports = router;