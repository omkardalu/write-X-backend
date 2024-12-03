const https = require('https');

const request = options => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let json = '';
      res.on('data', function (chunk) {
        json += chunk;
      });
      res.on('end', () => {
        const data = JSON.parse(json);
        if (data.error) {
          return reject(data.error);
        }
        resolve(data);
      });
    });
    req.end();
  });
};

module.exports = { request };
