import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appPort = 4322;
const s3Port = 4321;
const appBase = `http://127.0.0.1:${appPort}`;
const objects = new Map();

function readRequest(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const s3Server = http.createServer(async (req, res) => {
  const key = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname).replace(/^\/macluck-storage\//, '');
  if (req.method === 'PUT') {
    objects.set(key, { body: await readRequest(req), contentType: req.headers['content-type'] || 'application/octet-stream' });
    res.writeHead(200, { etag: `"${Buffer.from(key).toString('hex').slice(0, 32)}"` });
    return res.end();
  }
  if (req.method === 'GET' && objects.has(key)) {
    const object = objects.get(key);
    res.writeHead(200, { 'content-type': object.contentType, 'content-length': object.body.length });
    return res.end(object.body);
  }
  if (req.method === 'DELETE') {
    objects.delete(key);
    res.writeHead(204);
    return res.end();
  }
  res.writeHead(404, { 'content-type': 'application/xml' });
  res.end('<Error><Code>NoSuchKey</Code><Message>Not found</Message></Error>');
});

await new Promise((resolveListen) => s3Server.listen(s3Port, '127.0.0.1', resolveListen));
let app;
let stderr = '';

function startApp() {
  stderr = '';
  app = spawn(process.execPath, ['server/index.mjs'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(appPort),
      APP_ORIGIN: appBase,
      PUBLIC_URL: appBase,
      ADMIN_LOGIN: 'storage-audit',
      ADMIN_PASSWORD: 'storage-audit-password',
      SESSION_SECRET: 'storage-audit-session-secret-123456789',
      S3_ENDPOINT: `http://127.0.0.1:${s3Port}`,
      S3_REGION: 'ru-1',
      S3_BUCKET: 'macluck-storage',
      S3_ACCESS_KEY: 'local-access-key',
      S3_SECRET_KEY: 'local-secret-key',
      S3_DATABASE_KEY: 'macluck/database.json',
      S3_UPLOAD_PREFIX: 'macluck/uploads/',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  app.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
}

async function waitForApp() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${appBase}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`App did not start: ${stderr}`);
}

async function stopApp() {
  if (!app || app.exitCode !== null) return;
  app.kill();
  await new Promise((resolveExit) => app.once('exit', resolveExit));
}

async function request(path, options = {}) {
  const response = await fetch(appBase + path, options);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {}
  return { response, text, data };
}

try {
  startApp();
  await waitForApp();
  let result = await request('/api/health');
  assert.equal(result.data.persistentStorage, true);
  assert.equal(result.data.storageMode, 's3');

  result = await request('/api/auth/login', {
    method: 'POST',
    headers: { origin: appBase, 'content-type': 'application/json' },
    body: JSON.stringify({ login: 'storage-audit', password: 'storage-audit-password' }),
  });
  assert.equal(result.response.status, 200, result.text);
  const cookie = result.response.headers.get('set-cookie').split(';')[0];
  const adminHeaders = { origin: appBase, cookie, 'content-type': 'application/json' };

  result = await request('/api/admin/settings', {
    method: 'PUT', headers: adminHeaders, body: JSON.stringify({ hours: 'Проверка постоянного хранилища' }),
  });
  assert.equal(result.response.status, 200, result.text);

  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7F0AAAAASUVORK5CYII=';
  result = await request('/api/admin/upload', {
    method: 'POST', headers: adminHeaders, body: JSON.stringify({ data: `data:image/png;base64,${png}` }),
  });
  assert.equal(result.response.status, 201, result.text);
  const uploadUrl = result.data.url;
  assert.equal((await fetch(appBase + uploadUrl)).status, 200);

  const site = (await request('/api/public')).data;
  result = await request('/api/orders', {
    method: 'POST',
    headers: { origin: appBase, 'content-type': 'application/json' },
    body: JSON.stringify({
      consent: true,
      deliveryMethod: 'courier',
      customer: { name: 'Storage Test', phone: '+7 (900) 000-00-00', city: 'Москва', address: 'Тестовый адрес' },
      items: [{ id: site.products[0].id, quantity: 1, specs: {} }],
    }),
  });
  assert.equal(result.response.status, 201, result.text);
  const orderNumber = result.data.number;

  await stopApp();
  startApp();
  await waitForApp();

  const persistedSite = (await request('/api/public')).data;
  assert.equal(persistedSite.settings.hours, 'Проверка постоянного хранилища');
  assert.equal((await fetch(appBase + uploadUrl)).status, 200);

  result = await request('/api/auth/login', {
    method: 'POST',
    headers: { origin: appBase, 'content-type': 'application/json' },
    body: JSON.stringify({ login: 'storage-audit', password: 'storage-audit-password' }),
  });
  const secondCookie = result.response.headers.get('set-cookie').split(';')[0];
  const snapshot = await request('/api/admin/snapshot', { headers: { cookie: secondCookie } });
  assert.ok(snapshot.data.orders.some((order) => order.number === orderNumber));
  assert.equal(snapshot.data.system.storageMode, 's3');

  result = await request('/api/admin/upload', {
    method: 'DELETE',
    headers: { origin: appBase, cookie: secondCookie, 'content-type': 'application/json' },
    body: JSON.stringify({ url: uploadUrl }),
  });
  assert.equal(result.response.status, 200, result.text);
  assert.equal((await fetch(appBase + uploadUrl)).status, 404);
  assert.ok(objects.has('macluck/database.json'));
  assert.ok([...objects.keys()].every((key) => key === 'macluck/database.json'));

  console.log(JSON.stringify({ ok: true, storageMode: 's3', restartPersistence: true, orderNumber }));
} finally {
  await stopApp();
  await new Promise((resolveClose) => s3Server.close(resolveClose));
}