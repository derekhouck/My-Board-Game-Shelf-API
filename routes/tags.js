'use strict';

const express = require('express');

const Tag = require('../models/tag');

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
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Tag.findOne({ _id: id, userId })
    .then(result => res.json(result))
    .catch(err => next(err));
});

module.exports = router;