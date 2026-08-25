const express = require('express');
const path = require('path');
const packageJson = require('../package.json');

const app = express();

// version / build info can be injected via environment variables at deploy time
const APP_VERSION = process.env.APP_VERSION || packageJson.version;
const BUILD_ID = process.env.BUILD_ID || 'local';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/info', (req, res) => {
  res.json({
    name: packageJson.name,
    version: APP_VERSION,
    buildId: BUILD_ID,
    hostname: require('os').hostname(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

module.exports = app;
