const { Database, OPEN_CREATE, OPEN_READWRITE } = require('sqlite3');
const fs = require('fs');

const errorHandler = err => {
  if (err) {
    throw err;
  }
};

const csvParser = (path, hasHeader, delimeter) => {
  const rawData = fs.readFileSync(path, 'utf8');
  const parsedData = rawData.split('\n').map(line => line.split(delimeter));

  let header = '';
  let data = parsedData;

  if (hasHeader) {
    header = parsedData[0].join(',');
    data = parsedData.slice(1);
  }

  return { header, data };
};

const populateMockData = dbPath => {
  const db = new Database(dbPath, OPEN_READWRITE | OPEN_CREATE, errorHandler);

  const csvMetaData = JSON.parse(
    fs.readFileSync('./database/setup/csvMetaData.json', 'utf8')
  );

  for (let index = 0; index < csvMetaData.length; index++) {
    const storyRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const { table, file, hasHeader } = csvMetaData[index];
    const delimeter = table === 'stories' ? storyRegex : ',';
    const { header, data } = csvParser(file, hasHeader, delimeter);
    const headerStr = header ? `(${header})` : '';
    console.log(`\nstarted populating data into ${table} table`);

    data.forEach(line => {
      const sql = `INSERT INTO ${table}${headerStr} VALUES (${line})`;
      console.log('.');
      db.serialize(() => db.run(sql, errorHandler));
    });
    console.log(`finished populating data into ${table} table\n`);
  }

  db.close(errorHandler);
};

module.exports = populateMockData;
