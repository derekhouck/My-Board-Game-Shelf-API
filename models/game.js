'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  players: {
    min: Number,
    max: Number
  },
  status: {
    type: String, default: 'pending', enum: ['approved', 'pending', 'rejected']
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  title: { type: String, required: true },
});

// Add `createdAt` and `updatedAt` fields
schema.set('timestamps', true);

// Transform output during `res.json(data)`, `console.log(data)` etc.
schema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

module.exports = mongoose.model('Game', schema);