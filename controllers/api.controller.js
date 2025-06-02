const endpoints = require('../endpoints.json');

exports.getApi = function (req, res) {
  res.status(200);
  res.send({ endpoints });
};
