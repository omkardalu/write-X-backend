const { StatusCodes } = require('http-status-codes');
const hasFields = fields => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !field in req.body);
    if (missingFields.length == 0) {
      return next();
    }
    const error = 'Required fields not present in the request body';
    res.status(StatusCodes.BAD_REQUEST).json({ error, missingFields });
  };
};

const hasQueryParams = fields => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !field in req.query);
    if (missingFields.length == 0) {
      return next();
    }
    const error = 'Required query params not present';
    res.status(StatusCodes.BAD_REQUEST).json({ error, missingFields });
  };
};

const hasPathParams = fields => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !field in req.params);
    if (missingFields.length == 0) {
      return next();
    }
    const error = 'Required path params not present';
    res.status(StatusCodes.BAD_REQUEST).json({ error, missingFields });
  };
};

const allowAuthorized = (req, res, next) => {
  if (req.session.id) {
    next();
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'unauthorized' });
  }
};

const search = (req, res) => {
  req.app.locals.db
    .search(req.query.keyword, req?.session?.id)
    .then(({ authorBased, tagBased, contentBased }) => {
      authorBased = parseStoriesContent(authorBased);
      tagBased = parseStoriesContent(tagBased);
      contentBased = parseStoriesContent(contentBased);
      res.json({ authorBased, tagBased, contentBased });
    })
    .catch(handleFailure(res, StatusCodes.BAD_REQUEST));
};

const handleFailure = (res, statusCode) => {
  return error => {
    console.error(error);
    res.status(statusCode).json(error);
  };
};

const handleFailureWithMessage = (res, statusCode, error) => {
  return e => {
    console.error(e, error);
    res.status(statusCode).json({ error });
  };
};

const parseStoriesContent = stories => {
  return stories.map(story => {
    story.content = JSON.parse(story.content);
    return story;
  });
};

module.exports = {
  hasFields,
  allowAuthorized,
  search,
  handleFailure,
  handleFailureWithMessage,
  hasQueryParams,
  hasPathParams,
  parseStoriesContent,
};
