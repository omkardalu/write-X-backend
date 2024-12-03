const { StatusCodes } = require('http-status-codes');
const { handleFailure } = require('./commonHandler');

const getStory = (req, res) => {
  const { storyId } = req.params;
  const { id } = req.session;
  const { db } = req.app.locals;
  return db
    .getPublishedStoryDetails(storyId, id)
    .then(async story => {
      story.content = JSON.parse(story.content);
      story.views = await db.updateViews(id, story.id, story.authorId);
      const options = { story, isUserAuth: id != null };
      if (options.isUserAuth) {
        options.isFollowing = await db.isFollowing(story.authorId, id);
      }
      res.status(StatusCodes.OK).json(options);
    })
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

const getStoryResponses = (req, res) => {
  const { storyId } = req.params;
  const { id } = req.session;
  const { db } = req.app.locals;
  return db
    .getResponses(storyId)
    .then(async responses => {
      const story = await db.getPublishedStoryDetails(storyId, id);
      story.content = JSON.parse(story.content);
      const options = { story, responses };
      res.status(StatusCodes.OK).json(options);
    })
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

const addResponse = (req, res) => {
  const { storyId } = req.params;
  const { response } = req.body;
  req.app.locals.db
    .addResponse(storyId, req.session.id, response)
    .then(result => res.json(result))
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

const clap = (req, res) => {
  const { storyId } = req.params;
  req.app.locals.db
    .clap(storyId, req.session.id)
    .then(result => res.json(result))
    .catch(e => {
      if (e.error == 'No story found')
        handleFailure(res, StatusCodes.NOT_FOUND)(e);
      handleFailure(res, StatusCodes.BAD_REQUEST)(e);
    });
};

const publish = (req, res) => {
  const { storyId } = req.params;
  const { tags } = req.body;
  const coverImage = req.files?.coverImage || {};
  const storeLocation = `${__dirname}/../../database/images/${coverImage.name}`;
  coverImage.mv && coverImage.mv(storeLocation);
  const parsedTags = tags ? tags.split(',') : [];
  req.app.locals.db
    .publish(req.session.id, +storyId, parsedTags, coverImage.name)
    .then(result => res.json(result))
    .catch(e => {
      if (e.error == 'No story found')
        handleFailure(res, StatusCodes.NOT_FOUND)(e);
      handleFailure(res, StatusCodes.BAD_REQUEST)(e);
    });
};

const updateStory = (req, res) => {
  const { title, storyId, content } = req.body;
  if (!storyId) {
    return req.app.locals.db
      .createStory(req.session.id, title, JSON.stringify(content))
      .then(result => res.json(result));
  }
  req.app.locals.db
    .updateStory(storyId, title, req.session.id, JSON.stringify(content))
    .then(result => res.json(result))
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

const getDraft = (req, res) => {
  req.app.locals.db
    .getDraft(req.params.draftId, req.session.id)
    .then(draft => {
      draft.content = JSON.parse(draft.content);
      res.json({ draft });
    })
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

const deleteDraft = function (req, res) {
  req.app.locals.db
    .deleteDraft(req.body.draftId, req.session.id)
    .then(status => res.json(status))
    .catch(handleFailure(res, StatusCodes.NOT_FOUND));
};

module.exports = {
  getStory,
  getStoryResponses,
  addResponse,
  clap,
  publish,
  getDraft,
  deleteDraft,
  updateStory,
};
