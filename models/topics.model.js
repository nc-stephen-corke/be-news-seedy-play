const db = require('../db/connection');

exports.selectTopics = async function selectTopics() {
  const { rows: topics } = await db.query('SELECT * FROM TOPICS;');
  return topics;
};
