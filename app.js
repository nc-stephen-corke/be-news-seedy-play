const express = require('express');
const { getApi } = require('./contollers/api.controller');

const app = express();

app.get('/api', getApi);

module.exports = app;
