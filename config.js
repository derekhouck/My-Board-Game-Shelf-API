module.exports = {
  PORT: process.env.PORT || 8080,
  CORS_WHITELIST: [
    'https://myboardgameshelf.com',
    'https://gallant-minsky-655cfc.netlify.com',
    'https://my-board-game-shelf-api.herokuapp.com',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost/my-board-game-shelf-api',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'mongodb://localhost/my-board-game-shelf-api-test',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};