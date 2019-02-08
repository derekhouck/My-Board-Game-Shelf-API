'use strict';

const express = require('express');

const Tag = require('../models/tag');

const { isValidId } = require('./validators');

const router = express.Router();

// GET /api/tags
router.get('/', (req, res, next) => {
  const userId = req.user.id;

  Tag.find({ userId })
    .sort({ name: 'asc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

// GET /api/tags/:id
router.get('/:id', isValidId, (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Tag.findOne({ _id: id, userId })
    .then(result => result ? res.json(result) : next())
    .catch(err => next(err));
});

module.exports = router;