import http from 'node:http';
import { readFile, writeFile, mkdir, stat, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, join, normalize } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { products, categories, banners } from '../src/data/products.js';
import { news } from '../src/data/news.js';

loadEnv(resolve('.env'));
const PORT = Number(process.env.PORT || 3001);
const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
const allowedOrigins = new Set(ORIGIN.split(',').map(value => value.trim()).filter(Boolean));
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}
const DATA_FILE = resolve(process.env.DATA_FILE || './data/database.json');
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || './uploads');
const DIST_DIR = resolve('./dist');
const sessions = new Map();
const attempts = new Map();
const legalDefaults = [
  ['privacy', 'Политика обработки персональных данных'],
  ['consent', 'Согласие на обработку персональных данных'],
  ['terms', 'Пользовательское соглашение'],
  ['sales', 'Условия продажи, возврата и гарантии'],
];

await mkdir(resolve(DATA_FILE, '..'), { recursive: true });
await mkdir(UPLOAD_DIR, { recursive: true });
let db = await loadDatabase();

function loadEnv(path) {
  try {
    const text = requireRead(path);
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}

function requireRead(path) {
  return process.getBuiltinModule('fs').readFileSync(path, 'utf8');
}

async function loadDatabase() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    const initial = {
      products, categories, banners, news,
      filters: [],
      orders: [],
      legal: legalDefaults.map(([slug, title]) => ({
        id: slug, slug, title,
        content: `<h1>${title}</h1><p>[УКАЖИТЕ РЕКВИЗИТЫ И УТВЕРЖДЁННЫЙ ЮРИСТОМ ТЕКСТ]</p>`,
        seoTitle: title, seoDescription: '',
      })),
      settings: {
        siteName: 'MacLuck',
        logo: '/images/macluck-logo.svg',
        favicon: '/favicon.svg',
        phone: '[УКАЖИТЕ ТЕЛЕФОН]',
        email: '[УКАЖИТЕ EMAIL]',
        address: '[УКАЖИТЕ АДРЕС]',
        hours: '[УКАЖИТЕ ВРЕМЯ РАБОТЫ]',
        social: { telegram: '', vk: '', whatsapp: '' },
        seo: {
          title: 'MacLuck — техника и аксессуары',
          description: 'Интернет-магазин техники и аксессуаров',
          publicUrl: process.env.PUBLIC_URL || 'https://example.ru',
        },
        about: '<h1>О нас</h1><p>[ДОБАВЬТЕ ИНФОРМАЦИЮ О КОМПАНИИ]</p>',
        delivery: '<h1>Оплата и доставка</h1><p>[ДОБАВЬТЕ УСЛОВИЯ ОПЛАТЫ И ДОСТАВКИ]</p>',
      },
    };
    await writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function save() {
  const tmp = `${DATA_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await process.getBuiltinModule('fs/promises').rename(tmp, DATA_FILE);
}

function json(res, status, data, extra = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(data));
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => {
    const [k, ...rest] = v.trim().split('=');
    return [k, decodeURIComponent(rest.join('='))];
  }));
}

function isAdmin(req) {
  const token = cookies(req).ml_session;
  const session = token && sessions.get(token);
  return Boolean(session && session.expires > Date.now());
}

async function body(req, limit = 2_000_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function secureEqual(a, b) {
  const salt = process.env.SESSION_SECRET || 'development-only-secret';
  const ah = scryptSync(String(a), salt, 32);
  const bh = scryptSync(String(b), salt, 32);
  return timingSafeEqual(ah, bh);
}

function rateLimited(req, key, max = 8, windowMs = 60_000) {
  const id = `${key}:${req.socket.remoteAddress}`;
  const now = Date.now();
  const values = (attempts.get(id) || []).filter(t => now - t < windowMs);
  values.push(now);
  attempts.set(id, values);
  return values.length > max;
}

function cleanRecord(value) {
  return JSON.parse(JSON.stringify(value, (key, val) => {
    if (typeof val === 'string') return val.trim();
    return val;
  }));
}

async function telegram(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, reason: 'not_configured' };
  const lines = [
    `Новый заказ ${order.number}`,
    `Клиент: ${order.customer.name} ${order.customer.surname || ''}`.trim(),
    `Телефон: ${order.customer.phone}`,
    `Доставка: ${order.deliveryMethod}`,
    `Адрес: ${order.customer.address || order.customer.pickupAddress || ''}`,
    `Сумма: ${order.total.toLocaleString('ru-RU')} ₽`,
    ...order.items.map(i => `• ${i.name} × ${i.quantity} — ${i.price * i.quantity} ₽`),
  ];
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
  });
  if (!response.ok) throw new Error(`Telegram ${response.status}`);
  return { sent: true };
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  if (req.method !== 'GET' && req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
    return json(res, 403, { error: 'Недопустимый источник запроса' });
  }
  if (path === '/api/health') return json(res, 200, { ok: true });
  if (path === '/robots.txt') {
    const base = db.settings.seo.publicUrl;
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cart\nDisallow: /search\nSitemap: ${base}/sitemap.xml\n`);
  }
  if (path === '/sitemap.xml') {
    const base = db.settings.seo.publicUrl.replace(/\/$/, '');
    const paths = ['', '/catalog', '/news', '/about', '/delivery',
      ...db.products.map(p => `/product/${p.slug || p.id}`),
      ...db.news.map(n => `/news/${n.slug || n.id}`),
      ...db.legal.map(d => `/legal/${d.slug}`)];
    res.writeHead(200, { 'content-type': 'application/xml; charset=utf-8' });
    return res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
  }
  if (path === '/api/public') {
    return json(res, 200, {
      products: db.products.filter(item => item.published !== false),
      categories: db.categories.filter(item => item.published !== false),
      banners: db.banners.filter(item => item.published !== false),
      news: db.news.filter(item => item.published !== false),
      filters: db.filters.filter(item => item.published !== false),
      legal: db.legal.filter(item => item.published !== false),
      settings: db.settings,
    });
  }
  if (path === '/api/auth/login' && req.method === 'POST') {
    if (rateLimited(req, 'login', 5, 15 * 60_000)) return json(res, 429, { error: 'Слишком много попыток' });
    const data = await body(req);
    const login = process.env.ADMIN_LOGIN;
    const password = process.env.ADMIN_PASSWORD;
    if (!login || !password || password.startsWith('CHANGE_ME')) return json(res, 503, { error: 'Администратор не настроен' });
    if (!secureEqual(data.login, login) || !secureEqual(data.password, password)) return json(res, 401, { error: 'Неверный логин или пароль' });
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { expires: Date.now() + 8 * 60 * 60_000 });
    return json(res, 200, { ok: true }, {
      'set-cookie': `ml_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    });
  }
  if (path === '/api/auth/logout' && req.method === 'POST') {
    sessions.delete(cookies(req).ml_session);
    return json(res, 200, { ok: true }, { 'set-cookie': 'ml_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  if (path === '/api/auth/me') return json(res, isAdmin(req) ? 200 : 401, { authenticated: isAdmin(req) });
  if (path === '/api/orders' && req.method === 'POST') {
    if (rateLimited(req, 'order', 5, 10 * 60_000)) return json(res, 429, { error: 'Слишком много заявок. Попробуйте позже.' });
    const data = cleanRecord(await body(req));
    if (!data.consent || !data.customer?.name || !/^[+\d()\-\s]{7,24}$/.test(data.customer.phone || '') || !Array.isArray(data.items) || !data.items.length) {
      return json(res, 400, { error: 'Проверьте обязательные поля заказа' });
    }
    const calculated = [];
    for (const requested of data.items) {
      const product = db.products.find(p => String(p.id) === String(requested.id) && p.published !== false);
      const quantity = Math.max(1, Math.min(99, Number(requested.quantity) || 1));
      if (!product) return json(res, 400, { error: 'Один из товаров больше недоступен' });
      calculated.push({ productId: product.id, name: product.name, price: Number(product.price), quantity, image: product.image });
    }
    const duplicate = db.orders.find(order =>
      Date.now() - new Date(order.createdAt).getTime() < 30_000 &&
      order.customer.phone === data.customer.phone &&
      JSON.stringify(order.items.map(i => [String(i.productId), i.quantity])) === JSON.stringify(calculated.map(i => [String(i.productId), i.quantity]))
    );
    if (duplicate) return json(res, 200, { number: duplicate.number, total: duplicate.total, duplicate: true });
    const order = {
      id: randomUUID(),
      number: `ML-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(db.orders.length + 1).padStart(4, '0')}`,
      status: 'new', createdAt: new Date().toISOString(),
      customer: data.customer, deliveryMethod: data.deliveryMethod,
      items: calculated, total: calculated.reduce((sum, i) => sum + i.price * i.quantity, 0),
      telegram: { sent: false },
    };
    db.orders.unshift(order);
    await save();
    try { order.telegram = await telegram(order); } catch (error) { order.telegram = { sent: false, error: error.message }; }
    await save();
    return json(res, 201, { number: order.number, total: order.total });
  }
  if (!path.startsWith('/api/')) return serveStatic(path, res);
  if (!isAdmin(req)) return json(res, 401, { error: 'Требуется авторизация' });
  if (path === '/api/admin/snapshot' && req.method === 'GET') return json(res, 200, db);
  if (path === '/api/admin/settings' && req.method === 'PUT') {
    db.settings = { ...db.settings, ...cleanRecord(await body(req)) }; await save(); return json(res, 200, db.settings);
  }
  if (path === '/api/admin/upload' && req.method === 'POST') {
    const data = await body(req, 8_000_000);
    const match = String(data.data || '').match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/);
    if (!match) return json(res, 400, { error: 'Разрешены PNG, JPEG, WEBP и SVG' });
    const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/svg+xml': '.svg' }[match[1]];
    const name = `${randomUUID()}${ext}`;
    await writeFile(join(UPLOAD_DIR, name), Buffer.from(match[2], 'base64'));
    return json(res, 201, { url: `/uploads/${name}` });
  }
  if (path === '/api/admin/upload' && req.method === 'DELETE') {
    const data = await body(req);
    if (!String(data.url || '').startsWith('/uploads/')) return json(res, 400, { error: 'Можно удалить только загруженный файл' });
    const target = normalize(join(UPLOAD_DIR, data.url.slice(9)));
    if (!target.startsWith(UPLOAD_DIR)) return json(res, 403, { error: 'Недопустимый путь' });
    await unlink(target).catch(() => {});
    return json(res, 200, { ok: true });
  }
  const match = path.match(/^\/api\/admin\/(products|categories|filters|news|banners|legal|orders)(?:\/([^/]+))?$/);
  if (match) {
    const [, collection, id] = match;
    if (req.method === 'GET') return json(res, 200, db[collection]);
    if (req.method === 'POST') {
      const item = { ...cleanRecord(await body(req)), id: randomUUID() };
      db[collection].unshift(item); await save(); return json(res, 201, item);
    }
    const index = db[collection].findIndex(item => String(item.id) === decodeURIComponent(id));
    if (index < 0) return json(res, 404, { error: 'Запись не найдена' });
    if (req.method === 'PUT') {
      db[collection][index] = { ...db[collection][index], ...cleanRecord(await body(req)), id: db[collection][index].id };
      await save(); return json(res, 200, db[collection][index]);
    }
    if (req.method === 'DELETE') {
      const [removed] = db[collection].splice(index, 1); await save(); return json(res, 200, removed);
    }
  }
  return json(res, 404, { error: 'API endpoint не найден' });
}

async function serveStatic(path, res) {
  const upload = path.startsWith('/uploads/');
  const root = upload ? UPLOAD_DIR : DIST_DIR;
  let target = normalize(join(root, upload ? path.slice(9) : path === '/' ? 'index.html' : path.slice(1)));
  let statusCode = 200;
  if (!target.startsWith(root)) return json(res, 403, { error: 'Forbidden' });
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
  } catch {
    if (!upload) {
      target = join(DIST_DIR, 'index.html');
      const knownStatic = ['/', '/catalog', '/news', '/about', '/delivery', '/cart', '/search', '/favorites', '/clearance'];
      const knownDynamic = /^\/(product|news|brand|category|legal|admin)(\/|$)/.test(path);
      statusCode = knownStatic.includes(path) || knownDynamic ? 200 : 404;
    }
  }
  try {
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
    res.writeHead(statusCode, { 'content-type': types[extname(target)] || 'application/octet-stream' });
    createReadStream(target).pipe(res);
  } catch { json(res, 404, { error: 'Not found' }); }
}

export const server = http.createServer((req, res) => route(req, res).catch(error => {
  console.error(error);
  json(res, error.status || 500, { error: error.status ? error.message : 'Внутренняя ошибка сервера' });
}));
server.listen(PORT, () => console.log(`MacLuck server: http://localhost:${PORT}`));
