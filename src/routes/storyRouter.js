const express = require('express');
const router = express.Router();
const storyHandler = require('../handlers/storyHandler');
const handler = require('../handlers/commonHandler');

router.get('/:storyId/responses', storyHandler.getStoryResponses);
router.get('/:storyId', storyHandler.getStory);

router.use(handler.allowAuthorized);
router.put(
  '/',
  handler.hasFields(['title', 'content']),
  storyHandler.updateStory
);
router.post(
  '/:storyId/response',
  handler.hasFields(['response']),
  storyHandler.addResponse
);
router.put('/:storyId/clap', storyHandler.clap);
router.post(
  '/:storyId/publish',
  handler.hasFields(['tags']),
  storyHandler.publish
);

module.exports = router;
