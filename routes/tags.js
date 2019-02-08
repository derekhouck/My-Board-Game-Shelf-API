'use strict';

const express = require('express');

const Game = require('../models/game');
const Tag = require('../models/tag');

const { isValidId } = require('./validators');

const missingName = (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  } else {
    next();
  }
};

const router = express.Router();

// GET /api/tags
router.get('/', (req, res, next) => {

  Tag.find()
    .sort({ name: 'asc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

// GET /api/tags/:id
router.get('/:id', isValidId, (req, res, next) => {
  const { id } = req.params;

  Tag.findOne({ _id: id })
    .then(result => result ? res.json(result) : next())
    .catch(err => next(err));
});

// POST /api/tags
router.post('/', missingName, (req, res, next) => {
  const { name } = req.body;

  const newTag = { name };

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

//PUT /api/tags/:id
router.put('/:id',
  isValidId,
  missingName,
  (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;

    const updateTag = { name };

    Tag.findOneAndUpdate({ _id: id }, updateTag, { new: true })
      .then(result => {
        if (result) {
          res.json(result);
        } else {
          next();
        }
      })
      .catch(err => {
        if (err.code === 11000) {
          err = new Error('Tag name already exists');
          err.status = 400;
        }
        next(err);
      });
  });

// DELETE /api/games/:id
router.delete('/:id', isValidId, (req, res, next) => {
  const { id } = req.params;

  const tagRemovePromise = Tag.findOneAndDelete({ _id: id });

  const gameUpdatePromise = Game.updateMany(
    { tags: id },
    { $pull: { tags: id } }
  );

  Promise.all([tagRemovePromise, gameUpdatePromise])
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;