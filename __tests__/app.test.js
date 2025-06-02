const endpointsJson = require('../endpoints.json');
/* Set up your test imports here */
const app = require('../app');
const request = require('supertest');

/* Set up your beforeEach & afterAll functions here */

const seed = require('../db/seeds/seed');

describe('GET /api', () => {
  test('200: Responds with an object detailing the documentation for each endpoint', () => {
    return request(app)
      .get('/api')
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson);
      });
  });
});
