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
router.post('/', missingName, (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;

  const newTag = { name, userId };

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
    const userId = req.user.id;

    const updateTag = { name, userId };

    Tag.findOneAndUpdate({ _id: id, userId }, updateTag, { new: true })
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
  const userId = req.user.id;

  const tagRemovePromise = Tag.findOneAndDelete({ _id: id, userId });

  const gameUpdatePromise = Game.updateMany(
    { tags: id, userId },
    { $pull: { tags: id } }
  );

  Promise.all([tagRemovePromise, gameUpdatePromise])
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;