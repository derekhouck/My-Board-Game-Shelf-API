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

// POST /api/tags
router.post('/', (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;

  const newTag = { name, userId };

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;