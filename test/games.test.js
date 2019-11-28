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

describe('My Board Game Shelf API - Games', function () {
  let admin = {};
  let user = {};
  let adminToken, token;

  before(() => dbConnect(TEST_DATABASE_URL));

  beforeEach(() => {
    return Promise.all([
      User.insertMany(users),
      Game.insertMany(games),
      Tag.insertMany(tags),
      User.createIndexes()
    ])
      .then(([users]) => {
        admin = users.find(user => user.admin);
        user = users.find(user => !user.admin);
        adminToken = jwt.sign({ user: admin }, JWT_SECRET, { subject: admin.username });
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
        Game.find({ status: 'approved' }),
        chai.request(app)
          .get('/api/games')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list sorted asc with the correct fields', function () {
      return Promise.all([
        Game.find({ status: 'approved' })
          .sort({ title: 'asc' }),
        chai.request(app)
          .get('/api/games')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (game, i) {
            expect(game).to.be.a('object');
            // Note: folderId, tags and content are optional
            expect(game).to.have.all.keys(
              'id', 'status', 'title', 'createdAt', 'players', 'tags', 'updatedAt'
            );
            expect(game.id).to.equal(data[i].id);
            expect(game.status).to.equal('approved');
            expect(game.title).to.equal(data[i].title);
            expect(new Date(game.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(game.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a searchTerm query', function () {
      const searchTerm = 'king';

      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Game
        .find({
          title: re
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/games?searchTerm=${searchTerm}`)

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for number of players query', function () {
      const players = 7;

      const dbPromise = Game
        .find({
          'players.min': { $lte: players },
          'players.max': { $gte: players },
          status: 'approved',
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/games?players=${players}`)

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'players');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.players.min).to.equal(data[i].players.min);
            expect(item.players.max).to.equal(data[i].players.max);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a tagId query', function () {
      return Tag.findOne()
        .then(tag => {
          return Promise.all([
            Game.find({
              status: 'approved',
              tags: tag.id,
            }),
            chai.request(app)
              .get(`/api/games?tagId=${tag.id}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      const searchTerm = 'NOT-A-VALID-QUERY';

      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Game
        .find({
          userId: user.id,
          title: re
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/games?searchTerm=${searchTerm}`)

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Game.schema.options.toJSON, 'transform').throws('FakeError');

      return chai.request(app)
        .get('/api/games')
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe('GET /api/games/:id', function () {
    it('should return correct game', function () {
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/games/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys(
            'id', 'status', 'title', 'createdAt', 'players', 'tags', 'updatedAt'
          );
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      return chai.request(app)
        .get('/api/games/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/games/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Game.schema.options.toJSON, 'transform').throws('FakeError');
      return Game.findOne()
        .then(data => {
          return chai.request(app)
            .get(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe('POST /api/games', function () {
    it('should create and return a new game when provided valid data', function () {
      const newItem = {
        title: 'Test Game'
      };
      let res;
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'shelves', 'status', 'title', 'createdAt', 'updatedAt', 'tags');
          expect(res.body.status).to.equal('pending');
          return Game.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should add the submitted game to User.games', function () {
      const newGame = {
        title: 'Test Game'
      };
      let res;
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newGame)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title');
          expect(res.body.title).to.equal(newGame.title);
          return User.findById(user.id);
        })
        .then(userData => {
          expect(userData.games).to.include(res.body.id);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
      };
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing title in request body');
        });
    });

    it('should return an error when "title" is empty string', function () {
      const newItem = {
        title: ''
      };
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing title in request body');
        });
    });

    it('should return an error when min or max players are not numbers', function () {
      const newItem = {
        title: 'Test Game',
        minPlayers: 'not a number',
        maxPlayers: 'not a number'
      };
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('`minPlayers` and `maxPlayers` should be numbers');
        });
    });

    it('should return an error when max players is less than min players', function () {
      const newItem = {
        title: 'Test Game',
        minPlayers: 2,
        maxPlayers: 1
      };
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('`maxPlayers` should not be less than `minPlayers`');
        });
    });

    it('should return an error when a tag `id` is not valid', function () {
      const newItem = {
        title: 'Example Game',
        tags: ['NOT-A-VALID-ID']
      };
      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `tags` array contains an invalid `id`');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Game.schema.options.toJSON, 'transform').throws('FakeError');

      const newItem = {
        title: 'Example Game'
      };

      return chai.request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe('PUT /api/games/:id', function () {
    it('should update the game when provided a valid title', function () {
      const updateItem = { title: 'Updated Title' };
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect game to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should update the game when provided valid min and max player data', function () {
      const updateItem = { minPlayers: 14, maxPlayers: 41 };
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'players', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.players.min).to.equal(updateItem.minPlayers);
          expect(res.body.players.max).to.equal(updateItem.maxPlayers);
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect game to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should update the game when provided a valid tag', function () {
      const updateItem = { tags: [] };
      let data;

      return Promise.all([
        Tag.findOne(),
        Game.findOne()
      ])
        .then(([tag, note]) => {
          updateItem.tags.push(tag.id);
          data = note;
          return chai.request(app)
            .put(`/api/games/${note.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.tags[0].id).to.equal(updateItem.tags[0]);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should update the game when approved or rejected', function () {
      const approvedStatus = { status: 'approved' };
      const rejectedStatus = { status: 'rejected' };
      let game;

      return Game.findOne()
        .then(_game => {
          game = _game;
          return chai.request(app)
            .put(`/api/games/${game.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(approvedStatus);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.include.keys('id', 'status', 'updatedAt');
          expect(res.body.id).to.equal(game.id);
          expect(res.body.status).to.equal(approvedStatus.status);
          expect(new Date(res.body.updatedAt)).to.be.greaterThan(game.updatedAt);
          return chai.request(app)
            .put(`/api/games/${game.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(rejectedStatus);
        })
        .then(res2 => {
          expect(res2).to.have.status(200);
          expect(res2.body).to.include.keys('id', 'status', 'updatedAt');
          expect(res2.body.id).to.equal(game.id);
          expect(res2.body.status).to.equal(rejectedStatus.status);
          expect(new Date(res2.body.updatedAt)).to.be.greaterThan(game.updatedAt);
        });
    });

    it('should reject requests from non-admins', function () {
      const updateItem = { title: 'Updated Title' };
      return Game.findOne()
        .then(game => {
          return chai.request(app)
            .put(`/api/games/${game.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an("object");
          expect(res.body.message).to.equal("Unauthorized");
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      const updateItem = {
        title: 'Updated Title'
      };
      return chai.request(app)
        .put('/api/games/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      const updateItem = {
        title: 'Updated Title'
      };
      return chai.request(app)
        .put('/api/games/DOESNOTEXIST')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when "title" is an empty string', function () {
      const updateItem = { title: '' };
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when min or max players are not numbers', function () {
      const updateItem = {
        minPlayers: 'not a number',
        maxPlayers: 'not a number'
      };
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('`minPlayers` and `maxPlayers` should be numbers');
        });
    });

    it('should return an error when max players is less than min players', function () {
      const updateItem = {
        minPlayers: 2,
        maxPlayers: 1
      };
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('`maxPlayers` should not be less than `minPlayers`');
        });
    });

    it('should return an error when a tag `id` is not valid', function () {
      const updateItem = {
        tags: ['NOT-A-VALID-ID']
      };
      return Game.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `tags` array contains an invalid `id`');
        });
    });

    it('should return an error when given a status other than approved or rejected', function () {
      const invalidStatus = { status: 'NOT-A-VALID-STATUS' };

      return Game.findOne()
        .then(game => {
          return chai.request(app)
            .put(`/api/games/${game.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidStatus);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('That is not a valid status');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Game.schema.options.toJSON, 'transform').throws('FakeError');

      const updateItem = {
        title: 'Updated Title'
      };
      return Game.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .send(updateItem)
            .set('Authorization', `Bearer ${adminToken}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe('DELETE /api/games/:id', function () {
    it('should delete an existing game and respond with 204', function () {
      let data;
      return Game.findOne()
        .then(_data => {
          data = _data;

          return chai.request(app)
            .delete(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Game.countDocuments({ _id: data.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should reject requests from non-admins', function () {
      return Game.findOne()
        .then(game => {
          return chai.request(app)
            .delete(`/api/games/${game.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an("object");
          expect(res.body.message).to.equal("Unauthorized");
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      return chai.request(app)
        .delete('/api/games/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${adminToken}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(express.response, 'sendStatus').throws('FakeError');
      return Game.findOne()
        .then(data => {
          return chai.request(app)
            .delete(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });
});