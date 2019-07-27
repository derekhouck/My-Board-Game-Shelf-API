'use strict';

const mongoose = require('mongoose');

const isValidId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  } else {
    next();
  }
};

const isFieldValidId = idField => {
  return (req, res, next) => {
    const id = idField ? req.body[idField] : req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
    } else {
      next();
    }
  }
};

const requiredFields = fields => {
  return (req, res, next) => {
    const missingFields = [];
    if (!Array.isArray(fields)) {
      fields = [fields];
    }
    fields.forEach(field => {
      if (!(field in req.body) || !req.body[field]) {
        missingFields.push(field);
      }
    });
    if (missingFields.length > 0) {
      const err = new Error(`Missing ${missingFields.join(' and ')} in request body`);
      err.status = 400;
      return next(err);
    } else {
      return next();
    }
  };
};

module.exports = { isFieldValidId, isValidId, requiredFields };