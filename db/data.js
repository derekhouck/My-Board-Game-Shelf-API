'use strict';

// User #1 = odd numbers
// User #2 = even numbers

const users = [
  {
    _id: '000000000000000000000001',
    name: 'Ana User',
    username: 'anauser',
    password: '$2a$10$O4tYSlkzFykwKYIXIaKFXOjKYzfrwjSZmOak50rMpzhWW/aKHA06a' // "password"
  },
  {
    _id: '000000000000000000000002',
    name: 'Bob User',
    username: 'bobuser',
    password: '$2a$10$vXjjefbggXMi5S9130.Zu.AMcQoh2TqikDOmKn/7B6hpW6l8gX56W' // "baseball"
  },
];

const games = [
  {
    _id: '111111111111111111111101',
    title: 'Candy Land',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111103',
    title: 'Monopoly',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111105',
    title: 'King of New York',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111107',
    title: 'King of Tokyo',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111109',
    title: 'The Resistance',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111102',
    title: 'Tokaido',
    userId: '000000000000000000000002'
  },
  {
    _id: '111111111111111111111104',
    title: 'Clue',
    userId: '000000000000000000000002'
  },
  {
    _id: '111111111111111111111106',
    title: 'Battleship',
    userId: '000000000000000000000002'
  },
  {
    _id: '111111111111111111111108',
    title: 'Sorry!',
    userId: '000000000000000000000002'
  }
];

module.exports = { users, games };