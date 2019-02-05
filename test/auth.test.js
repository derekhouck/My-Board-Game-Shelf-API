'use strict';

const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');

const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);


describe('My Board Game Shelf API - Authentication', function () {
  const _id = '333333333333333333333333';
  const name = 'Example User';
  const username = 'exampleUser';
  const password = 'examplePass';

  before(function () {
    return dbConnect(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    return User.hashPassword(password)
      .then(digest => User.create({
        _id,
        name,
        username,
        password: digest
      }))
      .then(() => User.createIndexes());
  });

  afterEach(function () {
    return dbDrop();
  });

  after(function () {
    return dbDisconnect();
  });

  describe('POST /api/login', function () {
    it('should return a valid auth token', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');

          const payload = jwt.verify(res.body.authToken, JWT_SECRET);

          expect(payload.user).to.not.have.property('password');
          expect(payload.user.id).to.equal(_id);
          expect(payload.user.username).to.deep.equal(username.toLowerCase());
        });
    });

    it('should reject requests without credentials');

    it('should reject requests with empty string username');

    it('should reject requests with empty string password');

    it('should reject requests with incorrect username');

    it('should reject requests with incorrect password');
  });

  describe('POST /api/refresh', function () {
    it('should reject requests with no credentials');

    it('should reject requests with an invalid token');

    it('should reject requests with an expired token');

    it('should return a valid auth token with a newer expiry date');
  });
});