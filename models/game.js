const mongoose = require('mongoose');
const User = require('./user');

const schema = new mongoose.Schema({
  players: {
    min: Number,
    max: Number
  },
  shelves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String, default: 'pending', enum: ['approved', 'pending', 'rejected']
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  title: { type: String, required: true },
});

schema.method('updateShelves', function () {
  return User.find({ games: this['_id'] })
    .then(users => {
      this.shelves = users.map(user => user.id);
      return this.save();
    })
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