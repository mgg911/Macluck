import http from 'node:http';
import { readFile, writeFile, mkdir, stat, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, join, normalize } from 'node:path';
import { tmpdir } from 'node:os';
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
let DATA_FILE = resolve(process.env.DATA_FILE || './data/database.json');
let UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || './uploads');
const DIST_DIR = resolve('./dist');
const sessions = new Map();
const attempts = new Map();
const legalDefaults = [
  ['privacy', 'Политика обработки персональных данных'],
  ['consent', 'Согласие на обработку персональных данных'],
  ['terms', 'Пользовательское соглашение'],
  ['sales', 'Условия продажи, возврата и гарантии'],
];

const aboutContent = `<h1>О компании Macluck</h1>
<p><strong>Техника, которой можно доверять. Люди, на которых можно положиться.</strong></p>
<p>Уже более 5 лет команда Macluck помогает людям покупать современную технику легко, безопасно и с уверенностью. За это время мы пришли к простому выводу: главное в нашей работе — не количество продаж, а доверие клиентов.</p>
<p>Поэтому для нас каждая покупка — это не просто оформление заказа, а возможность помочь человеку выбрать устройство, которое будет радовать его каждый день. Мы внимательно относимся к потребностям каждого клиента, честно консультируем и всегда предлагаем только то, что действительно подходит.</p>
<h2>Почему выбирают Macluck?</h2>
<h3>Только оригинальная техника</h3>
<p>Мы продаем исключительно новую, официальную и оригинальную технику Apple, Dyson, PlayStation и других ведущих мировых брендов. Каждое устройство проходит проверку перед продажей и полностью соответствует высоким стандартам качества.</p>
<h3>Проверенные витринные устройства</h3>
<p>Помимо новой техники, в нашем ассортименте представлены тщательно отобранные витринные образцы. Перед поступлением в продажу каждое устройство проходит комплексную диагностику по 42 пунктам, включая проверку дисплея, аккумулятора, камер, динамиков, Face ID, Touch ID, всех модулей связи и остальных ключевых функций. В продажу попадает только техника, полностью соответствующая нашим требованиям.</p>
<h3>Клиент — всегда в центре внимания</h3>
<p>Мы строим долгосрочные отношения, основанные на доверии. Именно поэтому честность, открытость и высокий уровень сервиса являются основой нашей работы. Мы никогда не навязываем лишнего, подробно отвечаем на вопросы и помогаем подобрать оптимальное решение под ваши задачи и бюджет.</p>
<h3>Удобный Trade-In</h3>
<p>Обновить устройство стало проще. Вы можете обменять свою технику на новую, получив честную оценку и выгодные условия обмена.</p>
<h3>Поддержка после покупки</h3>
<p>Мы остаемся рядом и после оформления заказа. Если вам понадобится помощь, консультация или ответы на вопросы, команда Macluck всегда готова помочь.</p>
<h2>Наши ценности</h2>
<p><strong>Доверие.</strong> Мы понимаем, насколько важно быть уверенным в магазине, которому доверяешь покупку техники. Поэтому всегда работаем открыто и честно.</p>
<p><strong>Качество.</strong> Мы тщательно контролируем качество каждого устройства и сотрудничаем только с проверенными поставщиками.</p>
<p><strong>Сервис.</strong> Мы убеждены, что отличный сервис складывается из мелочей: внимательного отношения, профессиональных консультаций и искреннего желания помочь.</p>
<p><strong>Развитие.</strong> Мы постоянно совершенствуем ассортимент, сервис и процессы, чтобы делать покупку современной техники максимально удобной, безопасной и приятной.</p>
<h2>Наша миссия</h2>
<p>Мы хотим, чтобы покупка техники вызывала только положительные эмоции.</p>
<p>Наша цель — создать магазин, в который возвращаются снова и снова не только благодаря выгодным ценам, но и благодаря честному отношению, высокому уровню сервиса и уверенности в качестве каждого устройства.</p>
<p>Macluck — это место, где современные технологии сочетаются с настоящей заботой о клиентах. Мы ценим ваше доверие и ежедневно работаем над тем, чтобы оправдывать его на все 100%.</p>
<h2>Данные об ИП</h2>
<div class="company-details">
  <div><span>ИНН</span><strong>590800775583</strong></div>
  <div><span>ОГРНИП</span><strong>322665800215742</strong></div>
  <div><span>Дата регистрации</span><strong>16 ноября 2022 года</strong></div>
  <div><span>Регион регистрации</span><strong>Чеченская Республика</strong><small>Зарегистрирован налоговым органом в Чечне</small></div>
  <div class="company-details-wide"><span>Основной вид деятельности</span><strong>Торговля розничная по почте или по информационно-коммуникационной сети Интернет</strong><small>Код ОКВЭД 47.91</small></div>
</div>`;

const deliveryContent = `<h1>Оплата и доставка</h1>
<h2>Способы оплаты</h2>
<p>Пока доступна только оплата наличными. Безналичная оплата будет добавлена позже.</p>
<h2>Доставка</h2>
<h3>Москва</h3>
<p>Бесплатная курьерская доставка в пределах МКАД.</p>
<p>Доставка до 3 часов при оформлении заказа до 16:30.</p>
<h3>Доставка по России</h3>
<p>Доставка по РФ осуществляется при 100% предоплате.</p>
<p>Стоимость доставки рассчитывается по тарифам СДЭК.</p>
<h2>Гарантия</h2>
<p>Гарантия — 1 год с момента покупки.</p>
<h2>Возврат</h2>
<p>Возврат возможен в течение 14 дней.</p>`;

const defaultSettings = {
  contentVersion: 5,
  siteName: 'MacLuck',
  logo: '/images/macluck-logo.png',
  favicon: '/images/macluck-logo.png',
  phone: '',
  email: 'macluck.store@yandex.ru',
  address: '',
  hours: '',
  social: { telegram: 'https://t.me/macluckru', vk: 'https://vk.ru/macluck.store', whatsapp: '' },
  business: {
    inn: '590800775583',
    ogrnip: '322665800215742',
    registrationDate: '16 ноября 2022 года',
    registrationRegion: 'Чеченская Республика',
    activity: 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет',
    okved: '47.91',
  },
  seo: {
    title: 'MacLuck — оригинальная техника и аксессуары',
    description: 'MacLuck — магазин оригинальной техники Apple, Dyson, PlayStation и других ведущих брендов с доставкой по Москве и России.',
    publicUrl: process.env.PUBLIC_URL || 'https://mgg911-macluck-fc17.twc1.net',
  },
  about: aboutContent,
  delivery: deliveryContent,
};

try {
  await mkdir(resolve(DATA_FILE, '..'), { recursive: true });
  await mkdir(UPLOAD_DIR, { recursive: true });
} catch (error) {
  if (error?.code !== 'EACCES' || process.env.DATA_FILE || process.env.UPLOAD_DIR) throw error;
  const writableRoot = join(tmpdir(), 'macluck');
  DATA_FILE = join(writableRoot, 'database.json');
  UPLOAD_DIR = join(writableRoot, 'uploads');
  await mkdir(UPLOAD_DIR, { recursive: true });
  console.warn(`Read-only application directory detected; using temporary storage at ${writableRoot}`);
}
let db = await loadDatabase();
if (Number(db.settings?.contentVersion || 0) < defaultSettings.contentVersion) {
  db.settings = {
    ...defaultSettings,
    ...db.settings,
    contentVersion: defaultSettings.contentVersion,
    logo: defaultSettings.logo,
    favicon: defaultSettings.favicon,
    email: defaultSettings.email,
    phone: /^\[.*\]$/.test(db.settings?.phone || '') ? '' : (db.settings?.phone || ''),
    address: /^\[.*\]$/.test(db.settings?.address || '') ? '' : (db.settings?.address || ''),
    hours: /^\[.*\]$/.test(db.settings?.hours || '') ? '' : (db.settings?.hours || ''),
    social: { ...db.settings?.social, ...defaultSettings.social },
    business: defaultSettings.business,
    seo: { ...db.settings?.seo, ...defaultSettings.seo },
    about: defaultSettings.about,
    delivery: defaultSettings.delivery,
  };
  db.legal = (db.legal || []).map((item) =>
    String(item.content || '').includes('[УКАЖИТЕ') ? { ...item, content: `<h1>${item.title}</h1>` } : item
  );
  await save();
}

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
        content: `<h1>${title}</h1>`,
        seoTitle: title, seoDescription: '',
      })),
      settings: defaultSettings,
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

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    const requestHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    return new URL(origin).host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  if (req.method !== 'GET' && !isAllowedOrigin(req)) {
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
    const login = process.env.ADMIN_LOGIN?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();
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
  if (path === '/api/admin/snapshot' && req.method === 'GET') {
    return json(res, 200, {
      ...db,
      system: {
        telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      },
    });
  }
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
    const extension = extname(target);
    const cacheControl = extension === '.html'
      ? 'no-store, no-cache, must-revalidate'
      : path.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600';
    res.writeHead(statusCode, {
      'content-type': types[extension] || 'application/octet-stream',
      'cache-control': cacheControl,
    });
    createReadStream(target).pipe(res);
  } catch { json(res, 404, { error: 'Not found' }); }
}

export const server = http.createServer((req, res) => route(req, res).catch(error => {
  console.error(error);
  json(res, error.status || 500, { error: error.status ? error.message : 'Внутренняя ошибка сервера' });
}));
server.listen(PORT, () => console.log(`MacLuck server: http://localhost:${PORT}`));
