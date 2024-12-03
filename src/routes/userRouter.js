const express = require('express');
const user = express.Router();
const userHandler = require('../handlers/userHandler');
const { hasFields, allowAuthorized } = require('../handlers/commonHandler');

user.use(allowAuthorized);
user.get('/dashboard', userHandler.getDashboard);
user.get('/stories', userHandler.getUserStories);
user.get('/profile/:userId', userHandler.getProfile);
user.post('/follow', hasFields(['authorId']), userHandler.follow);
user.post('/unFollow', hasFields(['authorId']), userHandler.unFollow);
user.post('/logout', userHandler.logout);

module.exports = user;
