const { getDraft } = require('../db/queries');
const { StatusCodes } = require('http-status-codes');
const { handleFailure, parseStoriesContent } = require('./commonHandler');

const getDashboard = async (req, res) => {
  const { id, username, avatar_url } = req.session;
  let stories = await req.app.locals.db.getDashboardStories(id);
  stories = parseStoriesContent(stories);
  res.json({ id, username, avatar_url, stories });
};

const getUserStories = async (req, res) => {
  const { id } = req.session;
  let drafts = await req.app.locals.db.getDrafts(id);
  let published = await req.app.locals.db.getUserPublishedStories(id);
  drafts = parseStoriesContent(drafts);
  published = parseStoriesContent(published);
  res.json({ drafts, published });
};

const getProfile = (req, res) => {
  req.app.locals.db
    .getUserDetails(req.params.userId)
    .then(userDetails => {
      userDetails.stories = parseStoriesContent(userDetails.stories);
      res.json(userDetails);
    })
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

const follow = (req, res) => {
  req.app.locals.db
    .followAuthor(req.session.id, +req.body.authorId)
    .then(status => res.json(status))
    .catch(e => {
      if (e.error == 'No author found')
        handleFailure(res, StatusCodes.NOT_FOUND)(e);
      handleFailure(res, StatusCodes.BAD_REQUEST)(e);
    });
};

const unFollow = (req, res) => {
  req.app.locals.db
    .unFollowAuthor(req.session.id, +req.body.authorId)
    .then(status => res.json(status))
    .catch(handleFailure(res, StatusCodes.BAD_REQUEST));
};

const logout = (req, res) => {
  req.session = null;
  res.json({ status: 'Logged out' });
};

module.exports = {
  getDashboard,
  getUserStories,
  getDraft,
  getProfile,
  follow,
  unFollow,
  logout,
};
