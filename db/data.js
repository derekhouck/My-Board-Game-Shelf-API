// User #1 = odd numbers
// User #2 = even numbers

const users = [
  {
    _id: "000000000000000000000001",
    admin: true,
    email: "ana@example.com",
    name: "Ana Admin",
    username: "ana-admin",
    password: "$2a$10$O4tYSlkzFykwKYIXIaKFXOjKYzfrwjSZmOak50rMpzhWW/aKHA06a" // "password"
  },
  {
    _id: "000000000000000000000002",
    email: "bob@example.com",
    games: ["111111111111111111111108", "111111111111111111111107", "111111111111111111111103"],
    name: "Bob User",
    password: "$2a$10$vXjjefbggXMi5S9130.Zu.AMcQoh2TqikDOmKn/7B6hpW6l8gX56W", // "baseball"
    username: "bobuser",
  }
];

const games = [
  {
    _id: "111111111111111111111101",
    title: "Candy Land",
    players: {
      min: 2,
      max: 6
    },
    userId: "000000000000000000000001"
  },
  {
    _id: "111111111111111111111103",
    title: "Monopoly",
    players: {
      min: 2,
      max: 6
    },
    userId: "000000000000000000000001"
  },
  {
    _id: "111111111111111111111105",
    title: "King of New York",
    players: {
      min: 2,
      max: 8
    },
    status: 'approved',
    tags: ["222222222222222222222205", "222222222222222222222207"],
    userId: "000000000000000000000001"
  },
  {
    _id: "111111111111111111111107",
    title: "King of Tokyo",
    players: {
      min: 2,
      max: 8
    },
    status: 'approved',
    tags: [
      "222222222222222222222203",
      "222222222222222222222205"
    ],
    userId: "000000000000000000000001"
  },
  {
    _id: "111111111111111111111109",
    title: "The Resistance",
    players: {
      min: 2,
      max: 6
    },
    userId: "000000000000000000000001"
  },
  {
    _id: "111111111111111111111102",
    title: "Tokaido",
    players: {
      min: 2,
      max: 4
    },
    userId: "000000000000000000000002"
  },
  {
    _id: "111111111111111111111104",
    title: "Clue",
    players: {
      min: 2,
      max: 8
    },
    userId: "000000000000000000000002"
  },
  {
    _id: "111111111111111111111106",
    title: "Battleship",
    players: {
      min: 2,
      max: 2
    },
    tags: ["222222222222222222222202"],
    userId: "000000000000000000000002"
  },
  {
    _id: "111111111111111111111108",
    status: 'approved',
    title: "Sorry!",
    players: {
      min: 2,
      max: 4
    },
    tags: [
      "222222222222222222222201",
      "222222222222222222222202",
      "222222222222222222222206",
      "222222222222222222222208"
    ],
  },
  {
    _id: "111111111111111111111110",
    status: "approved",
    title: "Terraforming Mars",
    players: {
      min: 1,
      max: 5,
    },
    tags: [
      "222222222222222222222205"
    ],
  },
];

const tags = [
  {
    _id: "222222222222222222222201",
    name: "deck-building"
  },
  {
    _id: "222222222222222222222203",
    name: "dice"
  },
  {
    _id: "222222222222222222222205",
    name: "cards"
  },
  {
    _id: "222222222222222222222207",
    name: "kid-friendly"
  },
  {
    _id: "222222222222222222222209",
    name: "collectible card game"
  },
  {
    _id: "222222222222222222222202",
    name: "European"
  },
  {
    _id: "222222222222222222222204",
    name: "resource management"
  },
  {
    _id: "222222222222222222222206",
    name: "social deduction"
  },
  {
    _id: "222222222222222222222208",
    name: "educational"
  }
];

module.exports = { users, games, tags };
