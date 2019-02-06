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
const Tag = require('../models/tag');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const { users, games, tags } = require('../db/data');

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

    it('should return a list sorted asc with the correct fields', function () {
      return Promise.all([
        Game.find({ userId: user.id }).sort({ title: 'asc' }),
        chai.request(app)
          .get('/api/games')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            // Note: folderId, tags and content are optional
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'userId');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.userId).to.equal(data[i].userId.toString());
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a searchTerm query', function () {
      const searchTerm = 'king';

      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Game
        .find({
          userId: user.id,
          title: re
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/games?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);

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
          userId: user.id,
          'players.min': { $lte: players },
          'players.max': { $gte: players }
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/games?players=${players}`)
        .set('Authorization', `Bearer ${token}`);

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
      return Tag.findOne({ userId: user.id })
        .then(data => {
          return Promise.all([
            Game.find({ tags: data.id, userId: user.id }),
            chai.request(app)
              .get(`/api/games?tagId=${data.id}`)
              .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`);

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
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe('GET /api/games/:id', function () {
    it('should return correct games', function () {
      let data;
      return Game.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.userId).to.equal(data.userId.toString());
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
          expect(res.body).to.have.all.keys('id', 'title','createdAt', 'updatedAt', 'tags', 'userId');
          return Game.findOne({ _id: res.body.id, userId: user.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.userId).to.equal(data.userId.toString());
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
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
          expect(res.body.message).to.equal('Missing `title` in request body');
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
          expect(res.body.message).to.equal('Missing `title` in request body');
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
      return Game.findOne({
        userId: user.id
      })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
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
      return Game.findOne({
        userId: user.id
      })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
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
        Tag.findOne({ userId: user.id }),
        Game.findOne({
          userId: user.id
        })
      ])
        .then(([tag, note]) => {
          updateItem.tags.push(tag.id);
          data = note;
          return chai.request(app)
            .put(`/api/games/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
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

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      const updateItem = {
        title: 'Updated Title'
      };
      return chai.request(app)
        .put('/api/games/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when "title" is an empty string', function () {
      const updateItem = { title: '' };
      let data;
      return Game.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/games/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

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