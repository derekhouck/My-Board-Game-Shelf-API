/* eslint-disable no-unused-vars */
'use strict';
let userSchema, gameSchema, tagSchema, eventSchema;

// V1
userSchema = {
  username: String,
  password: String,
  name: String
};

gameSchema = {
  title: String,
  players: {
    min: Number,
    max: Number
  },
  tags: Array,
  userId: ObjectId
};

tagSchema = {
  name: String,
  userId: ObjectId
};

// V2
userSchema = {
  username: String,
  password: String,
  name: String,
  games: Array,
  admin: Boolean
};

gameSchema = {
  title: String,
  logo: Image,
  players: {
    min: Number,
    max: Number
  },
  tags: Array,
};

tagSchema = {
  name: String,
};

// V3
userSchema = {
  username: String,
  password: String,
  name: String,
  games: Array,
  admin: Boolean
};

gameSchema = {
  title: String,
  logo: Image,
  description: String,
  players: {
    min: Number,
    max: Number,
    recommended: Number
  },
  tags: Array,
  bgg_id: String
};

tagSchema = {
  name: String,
};

// V4
userSchema = {
  username: String,
  password: String,
  name: String,
  games: Array,
  admin: Boolean,
  friends: Array
};

gameSchema = {
  title: String,
  logo: Image,
  description: String,
  players: {
    min: Number,
    max: Number,
    recommended: Number
  },
  tags: Array,
  bgg_id: String
};

tagSchema = {
  name: String,
};

eventSchema = {
  participants: Array,
  date: Date,
  location: String,
  tags: Array
};