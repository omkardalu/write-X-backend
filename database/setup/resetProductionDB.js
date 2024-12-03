const fs = require('fs');
const { join } = require('path');
const resetDB = require('./resetDb');
const populateMockData = require('./populateMockData');

const mkDir = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const main = () => {
  const dbDir = '../backend/database';
  const dbPath = join(dbDir, 'medium.db');
  mkDir(dbDir);
  resetDB(dbPath);
  populateMockData(dbPath);
};

main();
