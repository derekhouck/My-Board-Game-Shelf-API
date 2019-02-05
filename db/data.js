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
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111103',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111105',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111107',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111109',
    userId: '000000000000000000000001'
  },
  {
    _id: '111111111111111111111102',
    userId: '000000000000000000000002'
  },
  {
    _id: '111111111111111111111104',
    userId: '000000000000000000000002'
  },
  {
    _id: '111111111111111111111106',
    userId: '000000000000000000000002'
  },
  {
    _id: '111111111111111111111108',
    userId: '000000000000000000000002'
  }
];

module.exports = { users, games };