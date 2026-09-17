import http from 'node:http';
import { makeSolidPng } from './make-png.js';

const IMAGES = {
  '/img/photo1.png': makeSolidPng(400, 300),
  '/img/photo2.png': makeSolidPng(500, 400),
  '/img/small.png': makeSolidPng(100, 75),
  '/img/photo3.png': makeSolidPng(600, 450),
  '/img/icon.png': makeSolidPng(16, 16),
  '/img/placeholder.png': makeSolidPng(16, 16),
};

const HTML = `<!doctype html>
<html>
<body>
  <a href="/photo/1"><img src="/img/photo1.png" alt="Photo One"></a>
  <a href="/photo/2"><img src="/img/placeholder.png" data-src="/img/photo2.png" width="500" height="400" alt="Photo Two"></a>
  <img srcset="/img/small.png 100w, /img/photo3.png 600w" sizes="600px" width="600" height="450" alt="Photo Three (srcset)">
  <img src="/img/icon.png" alt="tiny icon">
</body>
</html>`;

export function startFixtureServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HTML);
      return;
    }
    if (req.url && IMAGES[req.url]) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(IMAGES[req.url]);
      return;
    }
    if (req.url === '/not-an-image') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('not an image');
      return;
    }
    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

export const PHOTO1_BYTES = IMAGES['/img/photo1.png'].byteLength;
