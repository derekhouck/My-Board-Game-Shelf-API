const Queue = require('bull');
const { REDIS_URL } = require('./config');
const Game = require('./models/game');

const UPDATE_SHELVES = 'update-shelves';

const createQueues = () => {
  const updateShelvesQueue = new Queue(UPDATE_SHELVES, REDIS_URL);
  updateShelvesQueue.process('update shelves', job =>
    Game.find()
      .then(games => {
        const promises = [];
        games.forEach(game => promises.push(game.updateShelves()))
        return Promise.all(promises);
      })
      .then(results => results)
  )

  updateShelvesQueue.add('update shelves', {}, {
    repeat: { cron: '0 0 * * *' } // every day at 0:00
  });
}

module.exports = {
  UPDATE_SHELVES,
  createQueues
};