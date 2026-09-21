import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
import { createDatabase, restFetch } from './database.js';

// Ephemeral PostgreSQL + local PostgREST adapter. No .env or online Supabase.
const db = await createDatabase();
const request = restFetch(db);
const api = createHttpServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5174');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,apikey,Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  let body = '';
  for await (const chunk of req) body += chunk;
  const response = await request(`http://127.0.0.1:5188${req.url}`, { method: req.method, body: body || undefined });
  res.writeHead(response.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(await response.text());
});
await new Promise((resolve) => api.listen(5188, '127.0.0.1', resolve));
const vite = await createServer({
  configFile: 'tests/vite.config.js',
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
});
await vite.listen();
console.log('Local test guestbook: http://127.0.0.1:5174/contact.html (test data only)');
async function stop() { await vite.close(); api.close(); await db.close(); process.exit(0); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
