const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
const express = require("express");
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

const { TEST_DATABASE_URL, JWT_SECRET } = require("../config");
const { dbConnect, dbDisconnect, dbDrop } = require("../db-mongoose");

const User = require("../models/user");
const Game = require("../models/game");
const Tag = require('../models/tag');

const { users, games, tags } = require("../db/data");

const expect = chai.expect;
chai.use(chaiHttp);
const sandbox = sinon.createSandbox();

describe("My Board Game Shelf API - Users", function () {
  let user = {};
  let admin = {};
  let adminToken, token;
  const username = "exampleUser";
  const password = "examplePass";
  const name = "Example User";

  before(function () {
    sinon
      .stub(User, "hashPassword")
      .resolves("$2a$10$49s2s5pV.GaKdaJZ8oI0COlWmoB6Irmfb2b/xpYR.mJ3R2piklp62"); // Hash of 'examplePass'
    return dbConnect(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    return Promise.all([
      User.insertMany(users),
      Game.insertMany(games),
      Tag.insertMany(tags),
      User.createIndexes()
    ]).then(([users]) => {
      user = users.find(user => !user.admin);
      admin = users.find(user => user.admin);
      adminToken = jwt.sign({ user: admin }, JWT_SECRET, { subject: admin.username });
      token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
    });
  });

  afterEach(function () {
    sandbox.restore();
    return dbDrop();
  });

  after(function () {
    return dbDisconnect();
  });

  describe("POST /api/users", function () {
    it("should create a new user with lowercase username", function () {
      let res;
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password, name })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.keys("id", "username", "name", "admin");
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username.toLowerCase());
          expect(res.body.name).to.equal(name);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.name).to.equal(name);
          expect(user.admin).to.equal(false);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it("should reject users with missing username", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal("Missing field");
          expect(res.body.location).to.equal("username");
        });
    });

    it("should reject users with missing password", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal("Missing field");
          expect(res.body.location).to.equal("password");
        });
    });

    it("should reject users with non-string username", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username: 1234, password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Incorrect field type: expected string"
          );
          expect(res.body.location).to.equal("username");
        });
    });

    it("should reject users with non-string password", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password: 1234, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Incorrect field type: expected string"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should reject users with non-string name", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password, name: 1234 })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Incorrect field type: expected string"
          );
          expect(res.body.location).to.equal("name");
        });
    });

    it("should reject users with non-trimmed username", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username: ` ${username} `, password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Cannot start or end with whitespace"
          );
          expect(res.body.location).to.equal("username");
        });
    });

    it("should reject users with non-trimmed password", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password: ` ${password} `, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Cannot start or end with whitespace"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should reject users with empty username", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username: "", password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Must be at least 1 characters long"
          );
          expect(res.body.location).to.equal("username");
        });
    });

    it("should reject users with password less than 8 characters", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password: "1234567", name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Must be at least 8 characters long"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should reject users with password greater than 72 characters", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password: "a".repeat(73), name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Must be at most 72 characters long"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should reject users with a duplicate username", function () {
      return User.create({
        username,
        password,
        name
      })
        .then(() => {
          return chai
            .request(app)
            .post("/api/users")
            .send({ username, password, name });
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal("Username already taken");
          expect(res.body.location).to.equal("username");
        });
    });

    it("should trim name", function () {
      return chai
        .request(app)
        .post("/api/users")
        .send({ username, password, name: ` ${name} ` })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an("object");
          expect(res.body).to.include.keys("id", "username", "name");
          expect(res.body.name).to.equal(name);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.name).to.equal(name);
        });
    });
  });

  describe("GET /api/users", function () {
    it("should return an array of users", function () {
      const userOne = { username, password, name };
      const userTwo = {
        username: "secondUser",
        password: "examplePass2",
        name: "Second User"
      };
      return User.create(userOne, userTwo)
        .then(() => {
          return Promise.all([
            User.find(),
            chai
              .request(app)
              .get("/api/users")
              .set("Authorization", `Bearer ${adminToken}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          expect(res.body).to.have.length(data.length);
          res.body.forEach(user => {
            expect(user).to.have.keys("id", "username", "name", "admin");
          });
        });
    });

    it('should reject requests from non-admins', function () {
      return chai
        .request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an("object");
          expect(res.body.message).to.equal("Unauthorized");
        });
    });

    it("should catch errors and respond properly", function () {
      sandbox.stub(User.schema.options.toJSON, "transform").throws("FakeError");

      return User.create({ username, password, name })
        .then(() => {
          return chai
            .request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${adminToken}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body.message).to.equal("Internal Server Error");
        });
    });
  });

  describe("GET /api/users/:id/games", function () {
    it('should return the correct number of Games', function () {
      return Promise.all([
        Game.find({ userId: user.id }),
        chai.request(app)
          .get(`/api/users/${user.id}/games`)
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
          .get(`/api/users/${user.id}/games`)
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
        .get(`/api/users/${user.id}/games?searchTerm=${searchTerm}`)
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
    it('should return correct search results for a number of players query', function () {
      const players = 7;

      const dbPromise = Game
        .find({
          userId: user.id,
          'players.min': { $lte: players },
          'players.max': { $gte: players }
        })
        .sort({ title: 'asc' });

      const apiPromise = chai.request(app)
        .get(`/api/users/${user.id}/games?players=${players}`)
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
      return Tag.findOne()
        .then(data => {
          return Promise.all([
            Game.find({ tags: data.id }),
            chai.request(app)
              .get(`/api/users/${user.id}/games?tagId=${data.id}`)
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
        .get(`/api/users/${user.id}/games?searchTerm=${searchTerm}`)
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
        .get(`/api/users/${user.id}/games`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe("PUT /api/users", function () {
    it("should update the user when provided a valid name", function () {
      const updateData = { name: "Updated Name" };
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an("object");
          expect(res.body).to.include.keys("id", "name", "username");
          expect(res.body.id).to.equal(user.id);
          expect(res.body.name).to.equal(updateData.name);
          expect(res.body.username).to.equal(user.username);
        });
    });

    it("should update the user when provided a valid username", function () {
      const updateData = { username: "UpdatedUsername" };
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an("object");
          expect(res.body).to.include.keys("id", "name", "username");
          expect(res.body.id).to.equal(user.id);
          expect(res.body.name).to.equal(user.name);
          expect(res.body.username).to.equal(updateData.username.toLowerCase());
        });
    });

    it("should update the user when provided a valid password", function () {
      User.hashPassword.restore(); // Removes the earlier stub
      sandbox
        .stub(User, "hashPassword")
        .resolves(
          "$2a$10$8P7Em2F2M6m/X9z5WVB/quaL7NhuaplDILoNgotP8AERQCoTyNU.K"
        ); // Hash of 'updatedpassword'
      const updateData = { password: "updatedpassword" };
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an("object");
          expect(res.body).to.include.keys("id", "name", "username");
          expect(res.body.id).to.equal(user.id);
          expect(res.body.name).to.equal(user.name);
          expect(res.body.username).to.equal(user.username);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser).to.exist;
          expect(updatedUser.id).to.equal(user.id);
          expect(updatedUser.name).to.equal(user.name);
          return updatedUser.validatePassword(updateData.password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it("should respond with status 400 and an error message when `id` is not valid", function () {
      const updateData = {
        name: "Updated Name"
      };
      return chai
        .request(app)
        .put("/api/users/NOT-A-VALID-ID")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal("The `id` is not valid");
        });
    });

    it("should respond with a 404 for an id that does not exist", function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      const updateData = {
        name: "Updated Name"
      };
      return chai
        .request(app)
        .put("/api/users/DOESNOTEXIST")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it("should return an error with non-string username", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: 1234 })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Incorrect field type: expected string"
          );
          expect(res.body.location).to.equal("username");
        });
    });

    it("should return an error with non-string name", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: 1234 })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Incorrect field type: expected string"
          );
          expect(res.body.location).to.equal("name");
        });
    });

    it("should return an error with non-string password", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: 1234 })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Incorrect field type: expected string"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should return an error with non-trimmed username", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: " UpdatedUsername " })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Cannot start or end with whitespace"
          );
          expect(res.body.location).to.equal("username");
        });
    });

    it("should return an error with non-trimmed password", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: " updatedpassword " })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Cannot start or end with whitespace"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it('should return an error when "username" is an empty string', function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "" })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Must be at least 1 characters long"
          );
          expect(res.body.location).to.equal("username");
        });
    });

    it("should return an error when password is less than 8 characters", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "1234567" })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Must be at least 8 characters long"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should return an error when password is greater than 72 characters", function () {
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "a".repeat(73) })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal(
            "Must be at most 72 characters long"
          );
          expect(res.body.location).to.equal("password");
        });
    });

    it("should return an error when username is already taken", function () {
      return User.find()
        .then(users => {
          const user2 = users.filter(_user => _user.id !== user.id)[0];
          return chai
            .request(app)
            .put(`/api/users/${user.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ username: user2.username });
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal("ValidationError");
          expect(res.body.message).to.equal("Username already taken");
          expect(res.body.location).to.equal("username");
        });
    });

    it("should trim name", function () {
      const updatedName = "Updated Name";
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: ` ${updatedName} ` })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.include.keys("id", "username", "name");
          expect(res.body.name).to.equal(updatedName);
          return User.findOne({ _id: user.id });
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.name).to.equal(updatedName);
        });
    });

    it('should allow an admin to create another admin', function () {
      const updateData = { admin: true };
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.include.keys("id", "admin");
          expect(res.body.id).to.equal(user.id);
          expect(res.body.admin).to.equal(true);
        });
    });

    it('should prevent non-admins from creating admins', function () {
      const updateData = { admin: true };
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an("object");
          expect(res.body.message).to.equal("Unauthorized");
        });
    });

    it("should catch errors and respond properly", function () {
      sandbox.stub(User.schema.options.toJSON, "transform").throws("FakeError");

      const updateData = {
        name: "Updated Name"
      };
      return chai
        .request(app)
        .put(`/api/users/${user.id}`)
        .send(updateData)
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body.message).to.equal("Internal Server Error");
        });
    });
  });

  describe("DELETE /api/users", function () {
    it("should delete the logged in user and respond with 204", function () {
      return chai
        .request(app)
        .delete(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(204);
          return User.countDocuments({ _id: user.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it("should delete an existing user and remove all of their games", function () {
      let allGames;
      return Promise.all([Game.find(), Game.find({ userId: user.id })])
        .then(([_allGames, userGames]) => {
          allGames = _allGames;

          expect(allGames).to.be.an("array");
          expect(userGames).to.be.an("array");
          expect(allGames).to.not.have.length(0);
          expect(userGames).to.not.have.length(0);
          expect(allGames.length).to.not.equal(userGames.length);
          userGames.forEach(game => {
            expect(game.userId.toString()).to.equal(user.id.toString());
          });
          return chai
            .request(app)
            .delete(`/api/users/${user.id}`)
            .set("Authorization", `Bearer ${token}`);
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

    it("should respond with a 400 for an invalid id", function () {
      return chai
        .request(app)
        .delete("/api/users/NOT-A-VALID-ID")
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal("The `id` is not valid");
        });
    });

    it("should respond with a 400 when given a different user id", function () {
      let user2 = {};
      let user2Games;
      return User.find()
        .then(users => {
          expect(users).to.be.an("Array");
          const filteredUsers = users.filter(
            unfilteredUser => unfilteredUser.id !== user.id
          );
          expect(filteredUsers.length).to.not.equal(0);
          user2 = filteredUsers[0];
          expect(user2).to.be.an("object");
          expect(user2.id).to.not.equal(user.id);
          expect(user2.username).to.not.equal(user.username);
          return Game.find({ userId: user2.id });
        })
        .then(games => {
          user2Games = games;
          expect(user2Games).to.be.an("Array");
          expect(user2Games).to.not.have.length(0);
          user2Games.forEach(game => {
            expect(game.userId.toString()).to.equal(user2.id.toString());
          });
          return chai
            .request(app)
            .delete(`/api/users/${user2.id}`)
            .set("Authorization", `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal(
            "You cannot delete another user's account"
          );
          return Promise.all([
            User.countDocuments({ _id: user2.id }),
            Game.countDocuments({ userId: user2.id })
          ]);
        })
        .then(([userCount, gamesCount]) => {
          expect(userCount).to.equal(1);
          expect(gamesCount).to.equal(user2Games.length);
        });
    });

    it("should catch errors and respond properly", function () {
      sandbox.stub(express.response, "sendStatus").throws("FakeError");
      return chai
        .request(app)
        .delete(`/api/games/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body.message).to.equal("Internal Server Error");
        });
    });
  });
});
