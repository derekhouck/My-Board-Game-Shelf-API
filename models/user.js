const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const schema = mongoose.Schema({
  admin: { type: Boolean, default: false },
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  username: { type: String, required: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: "" },
});

// Add `createdAt` and `updatedAt` fields
schema.set('timestamps', true);

schema.set("toJSON", {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
    delete result.password;
  }
});

schema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

schema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model("User", schema);
