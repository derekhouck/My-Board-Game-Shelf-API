'use strict';

const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const User = require('../models/user');
const Game = require('../models/game');

const { users, games } = require('../db/data');

const expect = chai.expect;
chai.use(chaiHttp);
const sandbox = sinon.createSandbox();


describe('My Board Game Shelf API - Users', function () {
  let user = {};
  let token;
  const username = 'exampleUser';
  const password = 'examplePass';
  const name = 'Example User';

  before(function () {
    return dbConnect(TEST_DATABASE_URL);
  });

  beforeEach(function () {
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

  afterEach(function () {
    return dbDrop();
  });

  after(function () {
    return dbDisconnect();
  });

  describe('POST /api/users', function () {
    it('should create a new user with lowercase username', function () {
      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, name })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'name');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username.toLowerCase());
          expect(res.body.name).to.equal(name);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.name).to.equal(name);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it('should reject users with missing username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Missing field');
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with missing password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Missing field');
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with non-string username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: 1234, password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with non-string password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: 1234, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with non-string name', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, name: 1234 })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('name');
        });
    });

    it('should reject users with non-trimmed username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: ` ${username} `, password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with non-trimmed password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: ` ${password} `, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with empty username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: '', password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at least 1 characters long'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with password less than 8 characters', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: '1234567', name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at least 8 characters long'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with password greater than 72 characters', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: 'a'.repeat(73), name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at most 72 characters long'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with a duplicate username', function () {
      return User
        .create({
          username,
          password,
          name
        })
        .then(() => {
          return chai
            .request(app)
            .post('/api/users')
            .send({ username, password, name });
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Username already taken'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should trim name', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, name: ` ${name} ` })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'name');
          expect(res.body.name).to.equal(name);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.name).to.equal(name);
        });
    });
  });

  describe('GET /api/users', function () {
    const user = { username, name };
    const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: '1m' });

    it('should return an array of users', function () {
      const userOne = { username, password, name };
      const userTwo = {
        username: 'secondUser',
        password: 'examplePass2',
        name: 'Second User'
      };
      return User
        .create(userOne, userTwo)
        .then(() => {
          return Promise.all([
            User.find(),
            chai
              .request(app)
              .get('/api/users')
              .set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(user => {
            expect(user).to.have.keys('id', 'username', 'name');
          });
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(User.schema.options.toJSON, 'transform').throws('FakeError');

      return User
        .create({ username, password, name })
        .then(() => {
          return chai
            .request(app)
            .get('/api/users')
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

  describe.only('DELETE /api/users', function () {
    it('should delete the logged in user and respond with 204', function () {
      return chai.request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(204);
          return User.countDocuments({ _id: user.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should delete an existing user and remove all of their games', function () {
      let allGames;
      return Promise.all([
        Game.find(),
        Game.find({ userId: user.id })
      ])
        .then(([_allGames, userGames ]) => {
          allGames = _allGames;

          expect(allGames).to.be.an('array');
          expect(userGames).to.be.an('array');
          expect(allGames).to.not.have.length(0);
          expect(userGames).to.not.have.length(0);
          expect(allGames.length).to.not.equal(userGames.length);
          userGames.forEach(game => {
            expect(game.userId.toString()).to.equal(user.id.toString());
          });
          return chai.request(app)
            .delete(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          return Promise.all([
            Game.countDocuments(),
            Game.countDocuments({ userId: user.id })
          ]);
        })
        .then(([allGamesCount, userGamesCount]) => {
          expect(userGamesCount).to.equal(0);
          expect(allGamesCount).to.not.equal(0);
          expect(allGamesCount).to.not.equal(allGames.length);
        });
    });

    it('should respond with a 400 for an invalid id');

    it('should respond with a 400 when given a different user id');

    it('should catch errors and respond properly');
  });
});