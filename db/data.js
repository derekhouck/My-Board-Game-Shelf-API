const randomGamesArray = (games) => {
  const gameIds = games.map(game => game['_id']);
  const arr = [];
  for (let i = 0; i < 3; i++) {
    const index = Math.floor(Math.random() * gameIds.length);
    arr.push(gameIds[index]);
    gameIds.splice(index, 1); // prevent duplicates
  }
  return arr;
};

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
    category: 'Mechanics',
    name: "deck-building"
  },
  {
    _id: "222222222222222222222203",
    category: 'Mechanics',
    name: "dice"
  },
  {
    _id: "222222222222222222222205",
    category: 'Mechanics',
    name: "cards"
  },
  {
    _id: "222222222222222222222207",
    category: 'Themes',
    name: "kid-friendly"
  },
  {
    _id: "222222222222222222222209",
    category: 'Mechanics',
    name: "collectible card game"
  },
  {
    _id: "222222222222222222222202",
    category: 'Themes',
    name: "European"
  },
  {
    _id: "222222222222222222222204",
    category: 'Mechanics',
    name: "resource management"
  },
  {
    _id: "222222222222222222222206",
    category: 'Mechanics',
    name: "social deduction"
  },
  {
    _id: "222222222222222222222208",
    category: 'Themes',
    name: "educational"
  }
];

for (let i = 1; i <= 50; i++) {
  users.push({
    _id: i.to_s,
    email: `test-${i}@example.com`,
    games: randomGamesArray(games),
    name: `Test User ${i}`,
    password: "$2a$10$vXjjefbggXMi5S9130.Zu.AMcQoh2TqikDOmKn/7B6hpW6l8gX56W", // "baseball"
    username: `testuser${i}`,
  })
}

module.exports = { users, games, tags };
