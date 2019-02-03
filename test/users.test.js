'use strict';

const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { TEST_DATABASE_URL } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);

before(function() {
  return dbConnect(TEST_DATABASE_URL);
});

after(function() {
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

    it('should reject users with missing username');

    it('should reject users with missing password');

    it('should reject users with non-string username');

    it('should reject users with non-string password');

    it('should reject users with non-string name');

    it('should reject users with non-trimmed username');

    it('should reject users with non-trimmed password');

    it('should reject users with empty username');

    it('should reject users with password less than 8 characters');

    it('should reject users with password greater than 72 characters');

    it('should reject users with a duplicate username');

    it('should trim name');
  });
  
  describe('GET /api/users', function () {
    it('should return an empty array initially');

    it('should return an array of users');
  });
});