'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const app = require('../index');
const User = require('../models/user');
const Game = require('../models/game');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const { users, games } = require('../db/data');

chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('My Board Game Shelf API - Games', function () {
  let user = {};
  let token;

  before(() => dbConnect(TEST_DATABASE_URL));

  beforeEach(() => {
    return Promise.all([
      User.insertMany(users),
      Game.insertMany(games),
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

  describe('GET /api/games', function () {
    it('should return the correct number of Games', function () {
      return Promise.all([
        Game.find({ userId: user.id }),
        chai.request(app)
          .get('/api/games')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list sorted asc with the correct fields');

    it('should return correct search results for a searchTerm query');

    it('should return correct search results for number of players query');

    it('should return an empty array for an incorrect query');

    it('should catch errors and respond properly');
  });

  describe('GET /api/games/:id', function () {
    it('should return correct games');

    it('should respond with status 400 and an error message when `id` is not valid');

    it('should respond with a 404 for an ide that does not exist');

    it('should catch errors and respond properly');
  });

  describe('POST /api/games', function () {
    it('should create and return a new game when provided valid data');

    it('should create and return when min and max players are missing');

    it('should return an error when missing "title" field');

    it('should return an error when "title" is empty string');

    it('should return an error when min or max players are not numbers');

    it('should return an error when max players is less than min players');

    it('should return an error when a tag `id` is not valid');

    it('should catch errors and respond properly');
  });

  describe('PUT /api/games/:id', function () {
    it('should update the game when provided a valid title');

    it('should update the game when provided valid min and max player data');

    it('should update the game when provided a valid tag');

    it('should respond with status 400 and an error message when `id` is not valid');

    it('should respond with a 404 for an id that does not exist');

    it('should return an error when "title" is an empty string');

    it('should return an error when min or max players are not numbers');

    it('should return an error when max players is less than min players');

    it('should return an error when a tag `id` is not valid');

    it('should catch errors and respond properly');
  });

  describe('DELETE /api/games/:id', function () {
    it('should delete an existing game and respond with 204');

    it('should respond with a 400 for an invalid id');

    it('should catch errors and respond properly');
  });
});