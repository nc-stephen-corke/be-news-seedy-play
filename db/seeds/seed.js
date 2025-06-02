const format = require('pg-format');
const db = require('../connection');
const { convertTimestampToDate } = require('./utils');

const seed = ({ topicData, userData, articleData, commentData }) => {
  return (
    db
      .query(`DROP TABLE IF EXISTS votes;`)
      .then(() => db.query(`DROP TABLE IF EXISTS emoji_article_user;`))
      .then(() => db.query(`DROP TABLE IF EXISTS followed_topics;`))
      .then(() => db.query(`DROP TABLE IF EXISTS comments;`))
      .then(() => db.query(`DROP TABLE IF EXISTS articles;`))
      .then(() => db.query(`DROP TABLE IF EXISTS emojis;`)) // no dependencies
      .then(() => db.query(`DROP TABLE IF EXISTS users;`))
      .then(() => db.query(`DROP TABLE IF EXISTS topics;`))
      .then(() => {
        return db.query(`CREATE TABLE topics (
  slug VARCHAR(100) PRIMARY KEY,
  description VARCHAR(100),
  img_url VARCHAR(1000)
  );`);
      })
      .then(() => {
        return db.query(`CREATE TABLE users (
      username VARCHAR(100) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      avatar_url VARCHAR(1000)
      )`);
      })
      .then(() => {
        return db.query(`CREATE TABLE articles (
        article_id SERIAL PRIMARY KEY,
        title VARCHAR(250) NOT NULL,
        topic VARCHAR(100) REFERENCES topics(slug),
        author VARCHAR(100) REFERENCES users(username),
        body TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        votes INT DEFAULT 0,
        article_img_url VARCHAR(1000)
        )`);
      })
      .then(() => {
        return db.query(`CREATE TABLE comments (
        comment_id SERIAL PRIMARY KEY,
        article_id INT REFERENCES articles(article_id),
        body TEXT,
        votes INT DEFAULT 0,        
        author VARCHAR(100) REFERENCES users(username),
        created_at TIMESTAMP DEFAULT NOW()
)`);
      })
      .then(() => {
        const formattedTopics = topicData.map(
          ({ description, slug, img_url }) => {
            return [description, slug, img_url];
          }
        );
        return db.query(
          format(
            `INSERT INTO topics (description, slug, img_url) VALUES %L`,
            formattedTopics
          )
        );
      })
      .then(() => {
        const formattedUsers = userData.map(
          ({ username, name, avatar_url }) => {
            return [username, name, avatar_url];
          }
        );
        return db.query(
          format(
            `INSERT INTO users (username, name, avatar_url) VALUES %L`,
            formattedUsers
          )
        );
      })
      .then(() => {
        const formattedArticles = articleData
          .map((datum) => {
            return convertTimestampToDate(datum);
          })
          .map(
            ({ title, topic, author, body, created_at, article_img_url }) => {
              return [title, topic, author, body, created_at, article_img_url];
            }
          );

        return db.query(
          format(
            `INSERT INTO articles (title, topic, author, body, created_at, article_img_url) VALUES %L RETURNING *`,
            formattedArticles
          )
        );
      })
      .then((articles) => {
        const lookUp = articles.rows.reduce((acc, item) => {
          const { article_id, title } = item;
          acc[title] = article_id;
          return acc;
        }, {});
        const formattedComments = commentData
          .map((datum) => {
            return convertTimestampToDate(datum);
          })
          .map(({ article_title, body, votes, author, created_at }) => {
            return [lookUp[article_title], body, votes, author, created_at];
          });

        return db.query(
          format(
            `INSERT INTO comments (article_id, body, votes, author, created_at) VALUES %L`,
            formattedComments
          )
        );
      }) // Create emojis table
      .then(() => {
        return db.query(`
    CREATE TABLE emojis (
      emoji_id SERIAL PRIMARY KEY,
      emoji VARCHAR(10) NOT NULL
    );
  `);
      })

      // Create emoji_article_user table
      .then(() => {
        return db.query(`
    CREATE TABLE emoji_article_user (
      emoji_article_user_id SERIAL PRIMARY KEY,
      emoji_id INT REFERENCES emojis(emoji_id),
      username VARCHAR(100) REFERENCES users(username),
      article_id INT REFERENCES articles(article_id)
    );
  `);
      })

      // Create followed_topics table
      .then(() => {
        return db.query(`
    CREATE TABLE followed_topics (
      followed_topic_id SERIAL PRIMARY KEY,
      username VARCHAR(100) REFERENCES users(username),
      topic VARCHAR(100) REFERENCES topics(slug),
      UNIQUE(username, topic)
    );
  `);
      })

      // Create votes table
      .then(() => {
        return db.query(`
    CREATE TABLE votes (
      vote_id SERIAL PRIMARY KEY,
      username VARCHAR(100) REFERENCES users(username),
      article_id INT REFERENCES articles(article_id),
      vote_count INT NOT NULL,
      UNIQUE(username, article_id)
    );
  `);
      })

      // Insert seed data for emojis
      .then(() => {
        const emojiData = [['🔥'], ['❤️'], ['👍'], ['😂']];
        return db.query(
          format(`INSERT INTO emojis (emoji) VALUES %L RETURNING *;`, emojiData)
        );
      })

      // Insert seed data for followed_topics
      .then(() => {
        const followedTopicsData = [['butter_bridge', 'paper']];
        return db.query(
          format(
            `INSERT INTO followed_topics (username, topic) VALUES %L;`,
            followedTopicsData
          )
        );
      })

      // Insert seed data for emoji_article_user
      .then(() => {
        const emojiArticleUserData = [
          [2, 'butter_bridge', 2], // ❤️ on article_id 2
          [3, 'butter_bridge', 1], // 👍 on article_id 1
          [4, 'butter_bridge', 2], // 😂 on article_id 2
        ];
        return db.query(
          format(
            `INSERT INTO emoji_article_user (emoji_id, username, article_id) VALUES %L;`,
            emojiArticleUserData
          )
        );
      })

      // Insert seed data for votes
      .then(() => {
        const votesData = [
          ['butter_bridge', 2, -1],
          ['butter_bridge', 1, 1],
          ['butter_bridge', 3, 1],
        ];
        return db.query(
          format(
            `INSERT INTO votes (username, article_id, vote_count) VALUES %L;`,
            votesData
          )
        );
      })
  );
};
module.exports = seed;
