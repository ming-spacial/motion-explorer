const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = 3737;
const MOTION_V1_HOST = 'api.usemotion.com';
const MOTION_V2_HOST = 'internal.usemotion.com';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy all /proxy/* requests to the appropriate Motion API
// v2 paths → internal.usemotion.com, everything else → api.usemotion.com
app.all('/proxy/*', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  // Strip /proxy prefix to get the actual Motion API path
  const motionPath = req.path.replace(/^\/proxy/, '');
  const query = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : '';

  const hostname = motionPath.startsWith('/v2/') ? MOTION_V2_HOST : MOTION_V1_HOST;

  const options = {
    hostname,
    path: motionPath + query,
    method: req.method,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    res.set('Content-Type', 'application/json');

    let body = '';
    proxyRes.on('data', (chunk) => (body += chunk));
    proxyRes.on('end', () => {
      res.send(body);
    });
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  });

  if (req.method !== 'GET' && req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Motion API Explorer running at http://localhost:${PORT}`);
});
