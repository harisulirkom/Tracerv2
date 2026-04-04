const http = require('http');

const targets = [
  { host: '127.0.0.1', port: 8000 },
  { host: '127.0.0.1', port: 8001 },
  { host: '127.0.0.1', port: 8002 },
  { host: '127.0.0.1', port: 8003 },
];

let next = 0;

const server = http.createServer((req, res) => {
  const target = targets[next % targets.length];
  next += 1;

  const options = {
    host: target.host,
    port: target.port,
    method: req.method,
    path: req.url,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.statusCode = 502;
    res.end(`Bad gateway: ${err.message}`);
  });

  req.pipe(proxyReq);
});

const port = 9000;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`LB listening on http://127.0.0.1:${port}`);
});
