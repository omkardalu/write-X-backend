const queries = require('./queries');
const ONE = 1;

class Database {
  constructor(db) {
    this.db = db;
  }

  get(query) {
    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  exec(query) {
    return new Promise((resolve, reject) => {
      this.db.exec(query, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  all(query) {
    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  createStory(authorId, title, content) {
    return new Promise((resolve, reject) => {
      this.get(queries.getStoryIds()).then(row => {
        const id = row ? row.id + ONE : ONE;
        this.exec(queries.insertNewStory(id, authorId, title, content))
          .then(() => resolve({ status: 'Story created', storyId: id }))
          .catch(err => reject(err));
      });
    });
  }

  async updateStory(storyId, title, authorId, content) {
    const { isExists } = await this.get(
      queries.isDraftExists(authorId, storyId)
    );
    if (!isExists) {
      throw { error: 'No draft found' };
    }
    await this.exec(queries.saveStory(storyId, title, content));
    return { status: 'Story updated', storyId };
  }

  getDrafts(userId) {
    return this.all(queries.getDrafts(userId));
  }

  async addUser({ id, name, avatar_url }) {
    const user = await this.get(queries.getUserDetails(id));
    if (user) return user;
    return this.exec(queries.insertUser(id, name, avatar_url));
  }

  async getUserDetails(id) {
    const userDetails = await this.get(queries.getUserDetails(id));
    if (!userDetails) {
      throw { error: 'No user found' };
    }
    userDetails.followers = await this.all(queries.getFollowers(id));
    userDetails.following = await this.all(queries.getFollowing(id));
    userDetails.stories = await this.getUserPublishedStories(id);
    return userDetails;
  }

  getDraft(draftId, authorId) {
    return new Promise((resolve, reject) => {
      this.get(queries.getDraft(authorId, draftId)).then(draft => {
        if (!draft) {
          return reject({ error: 'No draft found' });
        }
        resolve(draft);
      });
    });
  }

  addTags(id, tags) {
    return new Promise(resolve => {
      if (!tags.length) {
        return resolve({ status: 'Empty tags' });
      }
      this.exec(queries.addTags(id, tags)).then(() =>
        resolve({ status: 'Added tags' })
      );
    });
  }

  publish(authorId, storyId, tags = [], imagePath = 'NULL') {
    return new Promise((resolve, reject) => {
      this.getDraft(storyId, authorId)
        .then(draft => {
          if (!draft) reject({ error: 'No story found' });
          if (!draft.title.trim() && !JSON.parse(draft.content).length) {
            const error = 'Cannot publish a story with empty title and content';
            return reject({ error });
          }
          this.exec(queries.publish(storyId, imagePath)).then(() => {
            const status = 'Published';
            this.addTags(storyId, tags).then(() => resolve({ status }));
          });
        })
        .catch(err => reject(err));
    });
  }

  getUserPublishedStories(userId) {
    return this.all(queries.getUserPublishedStories(userId));
  }

  async getPublishedStoryActivity(storyId, userId) {
    const { responsesCount } = await this.get(
      queries.getResponsesCount(storyId)
    );
    const { clapsCount } = await this.get(queries.getClapsCount(storyId));
    const { isClapped } = await this.get(queries.isClapped(storyId, userId));
    const tags = await this.getTags(storyId);
    return { responsesCount, clapsCount, isClapped, tags };
  }

  async getPublishedStoryDetails(storyId, userId = 'NULL') {
    const storyDetails = await this.get(
      queries.getPublishedStoryDetails(storyId, userId)
    );
    if (!storyDetails) {
      throw { error: 'No story found' };
    }
    const additional = await this.getPublishedStoryActivity(storyId, userId);
    additional.isAuthor = storyDetails.authorId === userId;
    Object.assign(storyDetails, additional);
    return storyDetails;
  }

  async isFollowing(userId, followerId) {
    const { isFollowing } = await this.get(
      queries.isFollowing(userId, followerId)
    );
    return isFollowing;
  }

  getResponses(storyId) {
    return new Promise((resolve, reject) => {
      this.get(queries.getPublishedStory(storyId)).then(story => {
        if (!story) {
          return reject({ error: 'No story found' });
        }
        this.all(queries.getResponses(storyId)).then(responses =>
          resolve(responses)
        );
      });
    });
  }

  async followAuthor(followerId, authorId) {
    if (followerId === authorId) {
      throw { error: 'You cannot follow yourself' };
    }
    const author = await this.get(queries.getUserDetails(authorId));
    if (!author) {
      throw { error: 'No author found' };
    }
    const follower = await this.get(queries.getFollower(authorId, followerId));
    if (follower) {
      throw { error: 'Already following' };
    }
    await this.exec(queries.addFollower(authorId, followerId));
    return { status: 'Following' };
  }

  async getDashboardStories(userId) {
    const followingStories = await this.all(queries.followingStories(userId));
    const myStories = await this.all(queries.myStories(userId));
    return followingStories.concat(myStories);
  }

  addResponse(storyId, userId, response) {
    return new Promise((resolve, reject) => {
      this.get(queries.getPublishedStory(storyId)).then(story => {
        if (!story) {
          return reject({ error: 'No story found' });
        }
        this.exec(queries.addResponse(storyId, userId, response)).then(() =>
          resolve({ status: 'added' })
        );
      });
    });
  }

  unFollowAuthor(followerId, authorId) {
    return new Promise((resolve, reject) => {
      this.get(queries.getFollower(authorId, followerId)).then(follower => {
        if (!follower) {
          return reject({ error: 'You are not a follower of this user' });
        }
        this.exec(queries.removeFollower(authorId, followerId)).then(() => {
          resolve({ status: 'Unfollowed' });
        });
      });
    });
  }

  async toggleClap(storyId, userId) {
    const { isClapped } = await this.get(queries.isClapped(storyId, userId));
    let { clapsCount } = await this.get(queries.getClapsCount(storyId));
    if (isClapped) {
      await this.exec(queries.removeClap(storyId, userId));
      return { isClapped: false, clapsCount: --clapsCount };
    }
    await this.exec(queries.addClap(storyId, userId));
    return { isClapped: true, clapsCount: ++clapsCount };
  }

  async clap(storyId, userId) {
    const story = await this.get(queries.getPublishedStory(storyId));
    if (!story) {
      throw { error: 'No story found' };
    }
    if (story.created_by === userId) {
      throw { error: 'You cannot clap or unclap on your own story' };
    }
    return await this.toggleClap(storyId, userId);
  }

  async getTags(storyId) {
    const tags = await this.all(queries.getTags(storyId));
    return tags.map(({ tag }) => tag);
  }

  async getMatchingStories(keyword) {
    const authorBased = await this.all(queries.authorBasedSearch(keyword));
    const contentBased = await this.all(queries.contentBasedSearch(keyword));
    const tagBased = await this.all(queries.tagBasedSearch(keyword));
    return { authorBased, tagBased, contentBased };
  }

  async search(keyword, userId) {
    if (keyword === undefined) {
      throw { error: 'invalid keyword' };
    }
    const results = await this.getMatchingStories(keyword);
    for (const type in results) {
      for (const story of results[type]) {
        const storyDetails = await this.getPublishedStoryDetails(
          story.id,
          userId
        );
        Object.assign(story, storyDetails);
      }
    }
    return results;
  }

  async updateViews(userId, storyId, authorId) {
    if (authorId !== userId) {
      await this.exec(queries.updateViews(storyId));
    }
    const { views } = await this.get(queries.getStoryViews(storyId));
    return views;
  }

  async deleteDraft(draftId, userId) {
    const { isExists } = await this.get(queries.isDraftExists(userId, draftId));
    if (!isExists) {
      throw { error: 'No draft found' };
    }
    await this.exec(queries.deleteDraft(draftId));
    return { status: 'deleted' };
  }
}

module.exports = Database;
