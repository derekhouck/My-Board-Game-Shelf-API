const mongoose = require('mongoose');
const { DATABASE_URL } = require('../config');

const Game = require('../models/game');
const User = require('../models/user');
const userList = {};

console.log(`Connecting to mongodb at ${DATABASE_URL}`);
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false })
  .then(() => {
    console.info(`Connected to ${DATABASE_URL}`);
    return Game.find();
  })
  .then(games => {
    games.forEach((game, i) => {
      console.info(`Adding ${game.title} to the user list for ${game.userId} (${i + 1} out of ${games.length})`)
      userList[game.userId] = userList[game.userId] ? [...userList[game.userId], game.id] : [game.id]
    });
    return User.find({ _id: { $in: Object.keys(userList) } });
  })
  .then(users => {
    users.forEach(user => {
      user.games
        ? console.log(`${user.name} has a games field`)
        : console.log(`${user.name} does not have a games field`)
    })
    const promiseList = [];
    Object.keys(userList).forEach((userId, i) => {
      currentUser = users.find(user => user.id === userId);
      const newGames = userList[userId].filter(game => currentUser.games.indexOf(game) < 0)
      console.info(`Creating Promise to add ${newGames.length} games to ${currentUser.name} (${i + 1} out of ${Object.keys(userList).length})`);
      promiseList.push(User.findByIdAndUpdate(userId, {
        $push: { "games": { $each: newGames } }
      }, { new: true }))
    })
    return Promise.all(promiseList);
  })
  .then(results => {
    results.forEach(user => console.info(`${user.name} now has the following games: 
    ${user.games}`));
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });