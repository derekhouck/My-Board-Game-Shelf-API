'use strict';

const mongoose = require('mongoose');

const { DATABASE_URL } = require('../config');

const User = require('../models/user');
const Game = require('../models/game');
const Tag = require('../models/tag');

const { users, games, tags } = require('../db/data');