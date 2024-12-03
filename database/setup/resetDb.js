const { Database, OPEN_CREATE, OPEN_READWRITE } = require('sqlite3');

const DBCOMMANDS = `
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      avatar_url TEXT
    );

    DROP TABLE IF EXISTS stories;
    CREATE TABLE stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_published INTEGER DEFAULT 0,
      last_modified TIMESTAMP NOT NULL
    );

    DROP TABLE IF EXISTS published_stories;
    CREATE TABLE published_stories (
      story_id INTEGER PRIMARY KEY,
      published_at TIMESTAMP NOT NULL,
      cover_image_name TEXT,
      views INTEGER DEFAULT 0
    );

    DROP TABLE IF EXISTS claps;
    CREATE TABLE claps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clapped_on INTEGER NOT NULL,
      clapped_by INTEGER NOT NULL
    );

    DROP TABLE IF EXISTS responses;
    CREATE TABLE responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      responded_on INTEGER NOT NULL,
      responded_by INTEGER NOT NULL,
      responded_at TIMESTAMP NOT NULL,
      response TEXT NOT NULL
    );

    DROP TABLE IF EXISTS followers;
    CREATE TABLE followers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      follower_id INTEGER NOT NULL
    );

    DROP TABLE IF EXISTS tags;
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      tag TEXT NOT NULL
    );`;

const resetDb = dbPath => {
  const db = new Database(dbPath, OPEN_READWRITE | OPEN_CREATE, err => {
    if (err) {
      throw err;
    }
  });

  db.serialize(() => db.exec(DBCOMMANDS));

  db.close(err => {
    if (err) {
      throw err;
    }
  });
};

module.exports = resetDb;
