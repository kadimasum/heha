const request = require('supertest');
const app = require('../src/app');

describe('GET /healthz', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /readyz', () => {
  it('returns 200 and status ready', async () => {
    const res = await request(app).get('/readyz');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });
});

describe('GET /api/info', () => {
  it('returns app metadata', async () => {
    const res = await request(app).get('/api/info');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'cicd-demo-app');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('buildId');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('reflects APP_VERSION and BUILD_ID env vars', async () => {
    process.env.APP_VERSION = '9.9.9';
    process.env.BUILD_ID = 'test-build-123';
    jest.resetModules();
    const freshApp = require('../src/app');
    const res = await request(freshApp).get('/api/info');
    expect(res.body.version).toBe('9.9.9');
    expect(res.body.buildId).toBe('test-build-123');
    delete process.env.APP_VERSION;
    delete process.env.BUILD_ID;
  });
});

describe('GET /', () => {
  it('serves the static index page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});
