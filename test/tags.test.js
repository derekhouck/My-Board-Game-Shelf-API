'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const express = require('express');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const app = require('../index');
const User = require('../models/user');
const Game = require('../models/game');
const Tag = require('../models/tag');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const { users, games, tags } = require('../db/data');

chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('My Board Game Shelf API - Tags', function () {
  let user = {};
  let token;

  before(() => dbConnect(TEST_DATABASE_URL));

  beforeEach(() => {
    return Promise.all([
      User.insertMany(users),
      Game.insertMany(games),
      Tag.insertMany(tags),
      User.createIndexes()
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(() => {
    sandbox.restore();
    return dbDrop();
  });

  after(() => dbDisconnect()); 

  describe('GET /api/tags', function () {
    it('should return the correct number of tags');

    it('shold return a list sorted by name with the correct fields and values');

    it('should catch errors and respond properly');
  });

  describe('GET /api/tags/:id', function () {
    it('should return correct tags');

    it('should respond with a 400 for an invalid id');

    it('should respond with a 404 for an id that does not exist');

    it('should catch errors and respond properly');
  });

  describe('POST /api/tags', function () {
    it('should create and return a new item when provided valid data');

    it('should return an error when missing "name" field');

    it('should return an error when "name" field is empty string');

    it('should return an error when given a duplicate name');

    it('should catch errors and respond properly');
  });

  describe('PUT /api/tags/:id', function () {
    it('should update the tag');

    it('should respond with a 400 for an invalid id');

    it('should respond with a 404 for an id that does not exist');

    it('should return an error when missing "name" field');

    it('should return an error when "name" field is empty string');

    it('should return an error when given a duplicate name');

    it('should catch errors and respond properly');
  });

  describe('DELETE /api/tags/:id', function () {
    it('should delete an existing tag and respond with 204');

    it('should delete an existing tag and remove tag reference from note');

    it('should respond with a 400 for an invalid id');

    it('should catch errors and respond properly');
  });
});