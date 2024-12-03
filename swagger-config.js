const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.1',
  info: {
    version: '1.0.0',
    title: 'Medium Backend APIs',
    description: 'All the APIs required to build medium',
    contact: {
      name: 'Mentors',
    },
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Medium backend server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/api-docs.yaml'], // Path to the API routes in your Node.js application
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
