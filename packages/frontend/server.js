import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'index.html');
const SCHWEMES_DIR = path.join(__dirname, '..', '..', 'schwemes');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.ts': 'text/plain',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // 1. Serve schwemes assets
  if (req.url.startsWith('/schwemes/')) {
    const filename = path.basename(req.url);
    const filePath = path.join(SCHWEMES_DIR, filename);
    const ext = path.extname(filePath).toLowerCase();

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
    return;
  }

  // 2. Serve static JS/TS files in packages/frontend/src or packages/sdk
  if (req.url.startsWith('/src/') || req.url.endsWith('.js') || req.url.endsWith('.ts')) {
    const filePath = path.join(__dirname, req.url);
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (err, data) => {
      if (!err) {
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
        res.end(data);
        return;
      }
    });
  }

  // 3. Default serve index.html
  fs.readFile(HTML_FILE, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error loading index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 SchwepeSwap Refined dApp running live at http://127.0.0.1:${PORT}`);
});
