'use strict';

const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { TEST_DATABASE_URL } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);

before(function () {
  return dbConnect(TEST_DATABASE_URL);
});

after(function () {
  return dbDisconnect();
});

describe('My Board Game Shelf API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const name = 'Example User';

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return dbDrop();
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
    it('should return an empty array initially');

    it('should return an array of users');
  });
});