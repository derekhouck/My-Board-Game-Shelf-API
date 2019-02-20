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

    it('should reject requests without credentials', function () {
      return chai.request(app)
        .post('/api/login')
        .send({})
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Bad Request');
        });
    });

    it('should reject requests with empty string username', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username: '', password })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Bad Request');
        });
    });

    it('should reject requests with empty string password', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username, password: '' })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Bad Request');
        });
    });

    it('should reject requests with incorrect username', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username: 'wrongUsername', password: 'password' })
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Unauthorized');
        });
    });

    it('should reject requests with incorrect password', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username, password: 'wrongPassword' })
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Unauthorized');
        });
    });
  });

  describe('POST /api/refresh', function () {
    it('should reject requests with no credentials', function () {
      return chai.request(app)
        .post('/api/refresh')
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should reject requests with an invalid token', function () {
      const token = jwt.sign({ username, password, name }, 'Incorrect Secret');
      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should reject requests with an expired token', function () {
      const token = jwt.sign({ username, password, name }, JWT_SECRET, { subject: username, expiresIn: Math.floor(Date.now() / 1000) - 10 });
      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return a valid auth token with a newer expiry date', function () {
      const user = { username, name };
      const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: '1m' });
      const decoded = jwt.decode(token);

      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.been.an('object');
          const authToken = res.body.authToken;
          expect(authToken).to.be.a('string');

          const payload = jwt.verify(authToken, JWT_SECRET);
          expect(payload.user).to.deep.equal({ username, name });
          expect(payload.exp).to.be.greaterThan(decoded.exp);
        });
    });
  });

  describe('POST /api/hard-refresh', function () {
    it('should reject requests with no credentials', function () {
      return chai.request(app)
        .post('/api/hard-refresh')
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should reject requests with an invalid token', function () {
      const token = jwt.sign({ username, password, name }, 'Incorrect Secret');
      return chai.request(app)
        .post('/api/hard-refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should reject requests with an expired token', function () {
      const token = jwt.sign({ username, password, name }, JWT_SECRET, { subject: username, expiresIn: Math.floor(Date.now() / 1000) - 10 });
      return chai.request(app)
        .post('/api/hard-refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return a valid auth token with user data that matches the database', function () {
      const user = { username, name };
      const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: '1m' });
      const decoded = jwt.decode(token);
      const newname = 'Updated Name';
      const updateData = { name: newname };

      return User.findOneAndUpdate({ username }, updateData, { new: true })
        .then(() => {
          return chai.request(app)
            .post('/api/hard-refresh')
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.been.an('object');
          const authToken = res.body.authToken;
          expect(authToken).to.be.a('string');

          const payload = jwt.verify(authToken, JWT_SECRET);
          expect(payload.user).to.deep.equal({
            username: username.toLowerCase(),
            name: newname
          });
          expect(payload.exp).to.be.greaterThan(decoded.exp);
        });
    });
  });
});