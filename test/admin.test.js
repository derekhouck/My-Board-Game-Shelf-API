const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const app = require('../index');
const Game = require('../models/game');
const Tag = require('../models/tag');
const User = require('../models/user');

const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');
const { games, tags, users } = require('../db/data');

chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('My Board Game Shelf API - Admin', function () {
  before(() => dbConnect(TEST_DATABASE_URL));

  beforeEach(() =>
    Promise.all([
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
      })
  );

  afterEach(() => {
    sandbox.restore();
    return dbDrop();
  });

  after(() => dbDisconnect());

  describe('GET /api/admin/games', function () {
    it('should return the correct number of Games', function () {
      return Promise.all([
        Game.find(),
        chai.request(app)
          .get('/api/admin/games')
          .set('Authorization', `Bearer ${adminToken}`)
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
        Game.find().sort({ title: 'asc' }),
        chai.request(app)
          .get('/api/admin/games')
          .set('Authorization', `Bearer ${adminToken}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            // Note: folderId, tags and content are optional
            expect(item).to.have.all.keys(
              'createdAt', 'id', 'shelves', 'status', 'title', 'players', 'tags', 'updatedAt'
            );
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
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
          title: re
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/admin/games?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${adminToken}`);

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
          'players.max': { $gte: players }
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/admin/games?players=${players}`)
        .set('Authorization', `Bearer ${adminToken}`);

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
        .then(data => {
          return Promise.all([
            Game.find({ tags: data.id }),
            chai.request(app)
              .get(`/api/admin/games?tagId=${data.id}`)
              .set('Authorization', `Bearer ${adminToken}`)
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
      const dbPromise = Game.find({ title: re });

      const apiPromise = chai.request(app)
        .get(`/api/admin/games?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${adminToken}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should reject requests without an auth token', function () {
      return chai.request(app)
        .get('/api/admin/games')
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal("Unauthorized");
        });
    });

    it('should reject requests from non-admins', function () {
      return chai.request(app)
        .get('/api/admin/games')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal("Unauthorized");
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Game.schema.options.toJSON, 'transform').throws('FakeError');

      return chai.request(app)
        .get('/api/admin/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });
});