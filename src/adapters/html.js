'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// CAVEMAN: This is a plain, dependency-free static file server.
// Only used when there is no framework and no package.json dev
// script — just an index.html sitting in a folder.

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const resolved = path.normalize(path.join(root, decoded));
  // CAVEMAN: Block path traversal (../../etc/passwd style requests).
  if (!resolved.startsWith(path.normalize(root))) {
    return null;
  }
  return resolved;
}

/**
 * Starts a static file server rooted at `dir`, listening on
 * `host:port`. Resolves with the http.Server instance once listening.
 */
function startStaticServer(dir, port, host) {
  const server = http.createServer((req, res) => {
    let filePath = safeJoin(dir, req.url || '/');

    if (!filePath) {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          // Fall back to root index.html for simple client-side
          // routing setups; otherwise a plain 404.
          const fallback = path.join(dir, 'index.html');
          if (filePath !== fallback) {
            fs.readFile(fallback, (fallbackErr, fallbackData) => {
              if (fallbackErr) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
              } else {
                res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
                res.end(fallbackData);
              }
            });
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

module.exports = { startStaticServer };
