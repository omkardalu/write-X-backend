const { request } = require('../util/request');
const { StatusCodes } = require('http-status-codes');
const { getDetailsOptions, getTokenOptions } = require('../util/options');
const { handleFailureWithMessage } = require('./commonHandler');

const fetchToken = (req, res) => {
  const { code } = req.query;
  const error = 'Invalid code';
  const clientId = `client_id=${req.app.locals.CLIENT_ID}`;
  const clientSecret = `client_secret=${req.app.locals.CLIENT_SECRET}`;
  const query = `${clientId}&${clientSecret}&code=${code}`;
  const tokenOptions = getTokenOptions(query);
  return request(tokenOptions)
    .then(({ access_token }) => access_token)
    .catch(handleFailureWithMessage(res, StatusCodes.BAD_REQUEST, error));
};

const fetchUserDetails = (_, res, token) => {
  const error = 'No user found';
  const detailsOptions = getDetailsOptions(token);
  return request(detailsOptions)
    .then(({ id, login, name, avatar_url }) => ({
      id,
      name: name || login,
      avatar_url,
    }))
    .catch(handleFailureWithMessage(res, StatusCodes.NOT_FOUND, error));
};

const storeUserDetails = async (req, res, userData) => {
  if (req.session.id) return userData;
  const error = 'Failed to store user details';
  await req.app.locals.db
    .addUser(userData)
    .catch(
      handleFailureWithMessage(res, StatusCodes.INTERNAL_SERVER_ERROR, error)
    );
  return userData;
};

const updateSessionWithUserDetails = (req, _, userData) => {
  req.session.id = userData.id;
  req.session.username = userData.name;
  req.session.avatar_url = userData.avatar_url;
};

const handleLogin = (req, res) => {
  fetchToken(req, res)
    .then(access_token => fetchUserDetails(req, res, access_token))
    .then(userData => storeUserDetails(req, res, userData))
    .then(userData => updateSessionWithUserDetails(req, res, userData))
    .then(() => res.redirect(req.app.locals.FRONT_END_URL));
};

const handlerIsLoggedIn = (req, res) => {
  const isLoggedIn = req.session.id != null;
  res.json({ isLoggedIn });
};

module.exports = {
  handleLogin,
  handlerIsLoggedIn,
};
