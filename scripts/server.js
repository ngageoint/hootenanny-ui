/* eslint-disable no-console */
const chalk = require('chalk');
const gaze = require('gaze');
const express = require('express');
const serveStatic = require('serve-static');
const proxy = require('express-http-proxy');
const buildCSS = require('./build_css.js');
const path = require('path');
const https = require('https');
const fs = require('fs');

const HOOT_FRONTEND_PORT = process.env.HOOT_FRONTEND_PORT || '8080'
const HOOT_FRONTEND_USE_HTTPS = process.env.HOOT_FRONTEND_USE_HTTPS || true
const HOOT_SERVICES_HOST = process.env.HOOT_SERVICES_HOST || '127.0.0.1'
const HOOT_SERVICES_PORT = process.env.HOOT_SERVICES_PORT || '8888'
const HOOT_TM_HOST = process.env.HOOT_TM_HOST || '127.0.0.1'

const dirname = process.cwd();

let app = express();

gaze(['css/**/*.css'], (err, watcher) => watcher.on('all', () => buildCSS()));


function proxyToPath(proxyPath, req) {
  const params = req.url.split('?')[1];

  if (req.path.length > 1) {
    proxyPath = path.join(proxyPath, req.path)
  }

  if (params) {
    proxyPath += `?${params}`
  }

  return proxyPath;
}

app.use(serveStatic(dirname, {cacheControl: false}));
app.use('/hoot-services', proxy(`http://${HOOT_SERVICES_HOST}:${HOOT_SERVICES_PORT}`, {
  proxyReqPathResolver: (req, res) => proxyToPath('/hoot-services', req)
}));
app.use('/static', proxy(`http://${HOOT_SERVICES_HOST}:${HOOT_SERVICES_PORT}`, {
  proxyReqPathResolver: (req, res) => proxyToPath('/static', req)
}));
app.use('/capabilities', proxy(`http://${HOOT_SERVICES_HOST}:8094`, {
  proxyReqPathResolver: (req, res) => proxyToPath('/capabilities', req)
}));
app.use('/switcher', proxy(`http://${HOOT_SERVICES_HOST}:8094`));
app.use('/p2p', proxy(`http://${HOOT_SERVICES_HOST}:8096`));
app.use('/tasks', proxy(`http://${HOOT_TM_HOST}:6543`));
app.use('/tm4api', proxy(`http://${HOOT_TM_HOST}:5000`));

const logins = ['login.min.js', 'login.min.css', 'login.js', 'login.css', 'login.html'];
const static = ['data', 'locales'];

static.forEach(staticPath => app.use(`/${staticPath}/:file`, (req, res) => res.sendFile(path.resolve('dist', staticPath, req.params.file))));
logins.forEach(file => app.use(`/${file}`, (req, res) => res.sendFile(path.resolve('dist', file))));

if (HOOT_FRONTEND_USE_HTTPS) {
  const cert_key = path.resolve(dirname, '../server.key');
  const cert_crt = path.resolve(dirname, '../server.crt');
  app = https.createServer({
    key: fs.readFileSync(cert_key, 'utf-8'), 
    cert: fs.readFileSync(cert_crt, 'utf-8')
  }, app);
}

app.listen(HOOT_FRONTEND_PORT);
console.log(chalk.yellow(`Listening on ${HOOT_FRONTEND_PORT}`));
