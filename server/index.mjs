import http from 'node:http';
import { readFile, writeFile, mkdir, stat, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, join, normalize, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { products, categories, banners } from '../src/data/products.js';
import { news } from '../src/data/news.js';
import { getProductImages, getProductPrice, sanitizeProductSpecs } from '../src/utils/productVariants.js';

loadEnv(resolve('.env'));
const PORT = Number(process.env.PORT || 3001);
const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
const allowedOrigins = new Set(ORIGIN.split(',').map(value => value.trim()).filter(Boolean));
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
  region: process.env.S3_REGION || 'ru-1',
  bucket: process.env.S3_BUCKET || '',
  accessKeyId: process.env.S3_ACCESS_KEY || '',
  secretAccessKey: process.env.S3_SECRET_KEY || '',
  databaseKey: process.env.S3_DATABASE_KEY || 'macluck/database.json',
  uploadPrefix: String(process.env.S3_UPLOAD_PREFIX || 'macluck/uploads/').replace(/^\/+|\/+$/g, '') + '/',
};
const s3Configured = Boolean(s3Config.bucket && s3Config.accessKeyId && s3Config.secretAccessKey);
const s3 = s3Configured ? new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  forcePathStyle: true,
  credentials: { accessKeyId: s3Config.accessKeyId, secretAccessKey: s3Config.secretAccessKey },
}) : null;
let DATA_FILE = resolve(process.env.DATA_FILE || './data/database.json');
let UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || './uploads');
let usingTemporaryStorage = false;
const DIST_DIR = resolve('./dist');
const sessions = new Map();
const attempts = new Map();
let saveQueue = Promise.resolve();
const operatorDetailsHtml = `<h2>Данные оператора</h2>
<div class="company-details">
  <div class="company-details-wide"><span>Индивидуальный предприниматель</span><strong>Ли Александр Андреевич</strong></div>
  <div><span>ИНН</span><strong>590800775583</strong></div>
  <div><span>ОГРНИП</span><strong>322665800215742</strong></div>
  <div class="company-details-wide"><span>Адрес</span><strong>Чеченская Республика, Курчалоевский район, с.п. Регитинское, с. Регита, ул. Ахъядова, д. 4</strong></div>
  <div><span>Email</span><strong><a href="mailto:macluck@yandex.ru">macluck@yandex.ru</a></strong></div>
  <div><span>Телефон</span><strong><a href="tel:+79194802324">+7 (919) 480-23-24</a></strong></div>
  <div class="company-details-wide"><span>Домен</span><strong><a href="https://macluck.ru">macluck.ru</a></strong></div>
</div>`;

const privacyContent = `<h1>Политика обработки персональных данных</h1>
${operatorDetailsHtml}
<h2>1. Общие положения</h2>
<p>Настоящая Политика обработки персональных данных определяет порядок обработки и защиты персональных данных пользователей сайта <a href="https://macluck.ru">https://macluck.ru</a>.</p>
<p>Оператором персональных данных является ИП Ли Александр Андреевич.</p>
<p>Политика разработана в соответствии с Федеральным законом РФ №152-ФЗ «О персональных данных».</p>
<h2>2. Какие данные собираются</h2>
<p>При оформлении заказа Пользователь предоставляет:</p>
<ul>
  <li>имя;</li>
  <li>номер телефона;</li>
  <li>адрес доставки.</li>
</ul>
<p>Также хостинг-провайдер может автоматически фиксировать техническую информацию:</p>
<ul>
  <li>IP-адрес;</li>
  <li>сведения о браузере;</li>
  <li>дату и время обращения к сайту.</li>
</ul>
<h2>3. Цели обработки</h2>
<p>Персональные данные обрабатываются исключительно для:</p>
<ul>
  <li>оформления заказа;</li>
  <li>связи с покупателем;</li>
  <li>организации доставки товара;</li>
  <li>исполнения обязательств по договору купли-продажи.</li>
</ul>
<h2>4. Правовые основания обработки</h2>
<p>Основанием обработки является:</p>
<ul>
  <li>добровольное согласие Пользователя;</li>
  <li>необходимость исполнения договора купли-продажи.</li>
</ul>
<h2>5. Передача данных</h2>
<p>Оператор не передает персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством РФ, либо когда такая передача необходима для доставки товара.</p>
<h2>6. Срок хранения</h2>
<p>Данные хранятся не дольше срока, необходимого для исполнения заказа и выполнения требований законодательства РФ о бухгалтерском и налоговом учете.</p>
<h2>7. Права пользователя</h2>
<p>Пользователь вправе:</p>
<ul>
  <li>запросить информацию о своих данных;</li>
  <li>потребовать их уточнения;</li>
  <li>потребовать удаления данных;</li>
  <li>отозвать согласие на обработку.</li>
</ul>
<p>Запрос направляется на <a href="mailto:macluck@yandex.ru">macluck@yandex.ru</a>.</p>
<h2>8. Защита данных</h2>
<p>Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, раскрытия или уничтожения.</p>
<h2>9. Контакты</h2>
<p>По всем вопросам обработки персональных данных:</p>
<p>Email: <a href="mailto:macluck@yandex.ru">macluck@yandex.ru</a><br>Телефон: <a href="tel:+79194802324">+7 (919) 480-23-24</a></p>`;

const termsContent = `<h1>Пользовательское соглашение</h1>
<h2>1. Общие положения</h2>
<p>Настоящее Соглашение регулирует использование сайта <a href="https://macluck.ru">https://macluck.ru</a>.</p>
<p>Используя сайт, Пользователь подтверждает согласие с условиями настоящего Соглашения.</p>
<h2>2. Предмет соглашения</h2>
<p>Сайт предоставляет информацию о товарах и возможность оформить заказ на приобретение техники и аксессуаров.</p>
<h2>3. Обязанности пользователя</h2>
<p>Пользователь обязуется:</p>
<ul>
  <li>указывать достоверные данные при оформлении заказа;</li>
  <li>не использовать сайт в противоправных целях;</li>
  <li>не предпринимать действий, нарушающих работу сайта.</li>
</ul>
<h2>4. Ответственность</h2>
<p>Оператор не несет ответственности за:</p>
<ul>
  <li>временную недоступность сайта;</li>
  <li>ошибки, вызванные действиями третьих лиц;</li>
  <li>невозможность использования сайта по причинам, не зависящим от Оператора.</li>
</ul>
<h2>5. Интеллектуальная собственность</h2>
<p>Все материалы сайта, включая логотип, изображения, тексты и элементы дизайна, принадлежат Macluck либо используются на законных основаниях.</p>
<h2>6. Заключительные положения</h2>
<p>Оператор вправе изменять настоящее Соглашение без предварительного уведомления. Актуальная версия всегда размещается на сайте.</p>`;

const cookiesContent = `<h1>Политика использования Cookie</h1>
<p>Сайт macluck.ru использует технические файлы cookie, необходимые для корректной работы сайта и обеспечения безопасности.</p>
<p>Cookie могут использоваться для:</p>
<ul>
  <li>сохранения пользовательских настроек;</li>
  <li>обеспечения корректной работы корзины и форм;</li>
  <li>ведения технических журналов хостинга.</li>
</ul>
<p>Продолжая использовать сайт, Пользователь соглашается с использованием файлов cookie.</p>
<p>Пользователь может отключить cookie в настройках своего браузера, однако это может повлиять на работоспособность отдельных функций сайта.</p>`;

const consentContent = `<h1>Согласие на обработку персональных данных</h1>
<h2>Текст согласия</h2>
<p>Нажимая кнопку «Оформить заказ», я подтверждаю, что ознакомлен(а) с Политикой обработки персональных данных и даю согласие ИП Ли Александру Андреевичу на обработку моих персональных данных (имя, номер телефона, адрес доставки) в целях оформления и исполнения заказа.</p>`;

const legalDefaults = [
  ['privacy', 'Политика обработки персональных данных', privacyContent],
  ['consent', 'Согласие на обработку персональных данных', consentContent],
  ['terms', 'Пользовательское соглашение', termsContent],
  ['cookies', 'Политика использования Cookie', cookiesContent],
  ['sales', 'Условия продажи, возврата и гарантии', '<h1>Условия продажи, возврата и гарантии</h1>'],
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
<h2>Данные оператора</h2>
<div class="company-details">
  <div class="company-details-wide"><span>Индивидуальный предприниматель</span><strong>Ли Александр Андреевич</strong></div>
  <div><span>ИНН</span><strong>590800775583</strong></div>
  <div><span>ОГРНИП</span><strong>322665800215742</strong></div>
  <div class="company-details-wide"><span>Адрес</span><strong>Чеченская Республика, Курчалоевский район, с.п. Регитинское, с. Регита, ул. Ахъядова, д. 4</strong></div>
  <div><span>Email</span><strong>macluck@yandex.ru</strong></div>
  <div><span>Телефон</span><strong>+7 (919) 480-23-24</strong></div>
  <div><span>Домен</span><strong>macluck.ru</strong></div>
  <div><span>Дата регистрации</span><strong>16 ноября 2022 года</strong></div>
  <div><span>Регион регистрации</span><strong>Чеченская Республика</strong><small>Зарегистрирован налоговым органом в Чечне</small></div>
  <div class="company-details-wide"><span>Основной вид деятельности</span><strong>Торговля розничная по почте или по информационно-коммуникационной сети Интернет</strong><small>Код ОКВЭД 47.91</small></div>
</div>`;

const deliveryContent = `<h1>Оплата и доставка</h1>
<h2>Способы оплаты</h2>
<p>Оплата заказа производится при получении.</p>
<h2>Доставка</h2>
<h3>Москва</h3>
<p>Бесплатно доставим по Москве в пределах МКАД за 3 часа.</p>
<h3>Доставка по России</h3>
<p>Доставка по РФ осуществляется при 100% предоплате.</p>
<p>Стоимость доставки рассчитывается по тарифам СДЭК.</p>
<h2>Гарантия</h2>
<p>Гарантия — 1 год с момента покупки.</p>
<h2>Возврат</h2>
<p>Возврат возможен в течение 14 дней.</p>`;

const defaultSettings = {
  contentVersion: 9,
  siteName: 'MacLuck',
  logo: '/images/macluck-logo.png',
  favicon: '/images/macluck-logo.png',
  phone: '+7 (919) 480-23-24',
  email: 'macluck@yandex.ru',
  address: 'Чеченская Республика, Курчалоевский район, с.п. Регитинское, с. Регита, ул. Ахъядова, д. 4',
  hours: '',
  social: { telegram: 'https://t.me/macluckru', vk: 'https://vk.ru/macluck.store', whatsapp: '' },
  business: {
    operatorName: 'Ли Александр Андреевич',
    inn: '590800775583',
    ogrnip: '322665800215742',
    registrationDate: '16 ноября 2022 года',
    registrationRegion: 'Чеченская Республика',
    activity: 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет',
    okved: '47.91',
    domain: 'macluck.ru',
  },
  seo: {
    title: 'MacLuck — оригинальная техника и аксессуары',
    description: 'MacLuck — магазин оригинальной техники Apple, Dyson, PlayStation и других ведущих брендов с доставкой по Москве и России.',
    publicUrl: process.env.PUBLIC_URL || 'https://macluck.ru',
  },
  about: aboutContent,
  delivery: deliveryContent,
};

if (!s3Configured) {
  try {
    await mkdir(resolve(DATA_FILE, '..'), { recursive: true });
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    if (error?.code !== 'EACCES' || process.env.DATA_FILE || process.env.UPLOAD_DIR) throw error;
    usingTemporaryStorage = true;
    const writableRoot = join(tmpdir(), 'macluck');
    DATA_FILE = join(writableRoot, 'database.json');
    UPLOAD_DIR = join(writableRoot, 'uploads');
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.warn(`Read-only application directory detected; using temporary storage at ${writableRoot}`);
  }
} else {
  console.info(`Persistent S3 storage enabled for bucket ${s3Config.bucket}`);
}
let db = await loadDatabase();
if (Number(db.settings?.contentVersion || 0) < defaultSettings.contentVersion) {
  const savedSettings = db.settings || {};
  db.settings = {
    ...defaultSettings,
    ...savedSettings,
    contentVersion: defaultSettings.contentVersion,
    hours: /^\[.*\]$/.test(savedSettings.hours || '') ? '' : (savedSettings.hours || ''),
    social: { ...defaultSettings.social, ...savedSettings.social },
    business: { ...defaultSettings.business, ...savedSettings.business },
    seo: { ...defaultSettings.seo, ...savedSettings.seo },
    delivery: defaultSettings.delivery,
  };
  const currentLegal = new Map((db.legal || []).map((item) => [item.slug, item]));
  const managedLegalDefaults = legalDefaults.filter(([slug]) => slug !== 'sales');
  const managedLegalSlugs = new Set(managedLegalDefaults.map(([slug]) => slug));
  db.legal = [
    ...managedLegalDefaults.map(([slug, title, content]) => ({
      ...currentLegal.get(slug),
      id: currentLegal.get(slug)?.id || slug,
      slug,
      title,
      content,
      seoTitle: title,
      seoDescription: currentLegal.get(slug)?.seoDescription || '',
      published: true,
    })),
    ...(db.legal || []).filter((item) => !managedLegalSlugs.has(item.slug)),
  ];
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

function createInitialDatabase() {
  return {
    products, categories, banners, news,
    filters: [],
    orders: [],
    legal: legalDefaults.map(([slug, title, content]) => ({
      id: slug, slug, title,
      content,
      seoTitle: title, seoDescription: '',
    })),
    settings: defaultSettings,
  };
}

function isMissingS3Object(error) {
  return error?.name === 'NoSuchKey' || error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404;
}

async function s3BodyToString(body) {
  if (!body) return '';
  if (typeof body.transformToString === 'function') return body.transformToString();
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function persistSerializedDatabase(serialized) {
  if (s3Configured) {
    await s3.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Config.databaseKey,
      Body: serialized,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'no-store',
    }));
    return;
  }
  const tmp = `${DATA_FILE}.tmp`;
  await writeFile(tmp, serialized);
  await process.getBuiltinModule('fs/promises').rename(tmp, DATA_FILE);
}

async function loadDatabase() {
  if (s3Configured) {
    try {
      const response = await s3.send(new GetObjectCommand({ Bucket: s3Config.bucket, Key: s3Config.databaseKey }));
      return JSON.parse(await s3BodyToString(response.Body));
    } catch (error) {
      if (!isMissingS3Object(error)) throw error;
      const initial = createInitialDatabase();
      await persistSerializedDatabase(JSON.stringify(initial, null, 2));
      return initial;
    }
  }
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    const initial = createInitialDatabase();
    await persistSerializedDatabase(JSON.stringify(initial, null, 2));
    return initial;
  }
}

function save() {
  const serialized = JSON.stringify(db, null, 2);
  const operation = saveQueue.catch(() => {}).then(() => persistSerializedDatabase(serialized));
  saveQueue = operation;
  return operation;
}

function persistentStorageEnabled() {
  return s3Configured || !usingTemporaryStorage;
}

function storageMode() {
  return s3Configured ? 's3' : usingTemporaryStorage ? 'temporary' : 'local';
}

async function storeUpload(name, mimeType, buffer) {
  if (s3Configured) {
    await s3.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Config.uploadPrefix + name,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return;
  }
  await writeFile(join(UPLOAD_DIR, name), buffer);
}

async function deleteUpload(name) {
  if (s3Configured) {
    await s3.send(new DeleteObjectCommand({ Bucket: s3Config.bucket, Key: s3Config.uploadPrefix + name }));
    return;
  }
  await unlink(join(UPLOAD_DIR, name)).catch(() => {});
}

async function serveS3Upload(path, res) {
  const name = path.slice('/uploads/'.length);
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return json(res, 404, { error: 'Not found' });
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: s3Config.bucket, Key: s3Config.uploadPrefix + name }));
    const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
    res.writeHead(200, responseHeaders({
      'content-type': response.ContentType || types[extname(name).toLowerCase()] || 'application/octet-stream',
      'cache-control': response.CacheControl || 'public, max-age=31536000, immutable',
      ...(response.ETag ? { etag: response.ETag } : {}),
    }));
    if (typeof response.Body?.pipe === 'function') response.Body.pipe(res);
    else res.end(Buffer.from(await response.Body.transformToByteArray()));
  } catch (error) {
    if (isMissingS3Object(error)) return json(res, 404, { error: 'Not found' });
    throw error;
  }
}

function responseHeaders(extra = {}) {
  return {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    ...extra,
  };
}

function json(res, status, data, extra = {}) {
  res.writeHead(status, responseHeaders({ 'content-type': 'application/json; charset=utf-8', ...extra }));
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

function isHttpsRequest(req) {
  const forwardedProtocol = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return Boolean(req.socket.encrypted || forwardedProtocol === 'https' || process.env.NODE_ENV === 'production');
}

async function body(req, limit = 2_000_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Некорректный JSON'), { status: 400 }); }
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

function validateAdminRecord(collection, value, currentId = null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Object.assign(new Error('Данные записи должны быть объектом'), { status: 400 });
  }
  const required = {
    products: ['name'],
    categories: ['name', 'slug'],
    filters: ['name', 'slug'],
    news: ['title', 'slug'],
    banners: ['title'],
    legal: ['title', 'slug'],
  }[collection] || [];
  if (required.some(field => !String(value[field] || '').trim())) {
    throw Object.assign(new Error('Заполните обязательные поля записи'), { status: 400 });
  }
  if (value.slug && db[collection]?.some(item => String(item.id) !== String(currentId) && item.slug === value.slug)) {
    throw Object.assign(new Error('Запись с таким slug уже существует'), { status: 409 });
  }
  if (collection === 'products') {
    if (!Number.isFinite(Number(value.price)) || Number(value.price) < 0) {
      throw Object.assign(new Error('Укажите корректную цену товара'), { status: 400 });
    }
    if (!Array.isArray(value.specs) || value.specs.some(spec => !spec?.name || !Array.isArray(spec.options))) {
      throw Object.assign(new Error('Характеристики товара заполнены некорректно'), { status: 400 });
    }
    if (value.images != null && !Array.isArray(value.images)) {
      throw Object.assign(new Error('Галерея товара должна быть списком'), { status: 400 });
    }
    if (value.colorImages != null && (typeof value.colorImages !== 'object' || Array.isArray(value.colorImages) || Object.values(value.colorImages).some(images => !Array.isArray(images)))) {
      throw Object.assign(new Error('Фотографии цветов заполнены некорректно'), { status: 400 });
    }
    if (value.variantPrices != null && (
      typeof value.variantPrices !== 'object' ||
      Array.isArray(value.variantPrices) ||
      Object.keys(value.variantPrices).length > 500 ||
      Object.entries(value.variantPrices).some(([key, price]) => !key || key.length > 500 || !Number.isFinite(Number(price)) || Number(price) < 0)
    )) {
      throw Object.assign(new Error('Цены комбинаций товара заполнены некорректно'), { status: 400 });
    }
  }
  if (collection === 'categories' && value.children != null && !Array.isArray(value.children)) {
    throw Object.assign(new Error('Подкатегории должны быть списком'), { status: 400 });
  }
  if (collection === 'filters' && value.values != null && !Array.isArray(value.values)) {
    throw Object.assign(new Error('Значения фильтра должны быть списком'), { status: 400 });
  }
  if (collection === 'banners' && value.link) {
    const link = String(value.link).trim();
    if (!link.startsWith('/') || link.startsWith('//')) {
      throw Object.assign(new Error('Ссылка баннера должна вести на внутреннюю страницу сайта'), { status: 400 });
    }
  }
  return value;
}

async function sendTelegramText(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, reason: 'not_configured' };
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw Object.assign(new Error(`Telegram вернул ошибку ${response.status}`), { status: 502 });
  return { sent: true };
}

async function telegram(order) {
  const lines = [
    `Новый заказ ${order.number}`,
    `Клиент: ${order.customer.name} ${order.customer.surname || ''}`.trim(),
    `Телефон: ${order.customer.phone}`,
    `Доставка: ${order.deliveryMethod}`,
    `Адрес: ${order.customer.address || order.customer.pickupAddress || ''}`,
    `Сумма: ${order.total.toLocaleString('ru-RU')} ₽`,
    ...order.items.map(i => {
      const specs = Object.values(i.specs || {}).filter(Boolean).join(', ');
      return `• ${i.name}${specs ? ` (${specs})` : ''} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString('ru-RU')} ₽`;
    }),
  ];
  return sendTelegramText(lines.join('\n'));
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
  if (path === '/api/health') return json(res, 200, {
    ok: true,
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    persistentStorage: persistentStorageEnabled(),
    storageMode: storageMode(),
  });
  if (path === '/robots.txt') {
    const base = db.settings.seo.publicUrl;
    res.writeHead(200, responseHeaders({ 'content-type': 'text/plain; charset=utf-8' }));
    return res.end(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cart\nDisallow: /search\nSitemap: ${base}/sitemap.xml\n`);
  }
  if (path === '/sitemap.xml') {
    const base = db.settings.seo.publicUrl.replace(/\/$/, '');
    const paths = [...new Set([
      '', '/catalog', '/news', '/about', '/delivery', '/clearance', '/privacy', '/terms', '/cookies', '/consent',
      ...db.categories.filter(item => item.published !== false).flatMap(category => [
        `/brand/${encodeURIComponent(category.slug || category.name)}`,
        ...(category.children || []).filter(item => item.published !== false).map(child => `/brand/${encodeURIComponent(child.slug || child.name)}`),
      ]),
      ...db.products.filter(item => item.published !== false).map(product => `/product/${encodeURIComponent(product.slug || product.id)}`),
      ...db.news.filter(item => item.published !== false).map(article => `/news/${encodeURIComponent(article.slug || article.id)}`),
      ...db.legal.filter(item => item.published !== false && !['privacy', 'terms', 'cookies', 'consent'].includes(item.slug)).map(document => `/legal/${encodeURIComponent(document.slug)}`),
    ])];
    res.writeHead(200, responseHeaders({ 'content-type': 'application/xml; charset=utf-8' }));
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
      'set-cookie': `ml_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${isHttpsRequest(req) ? '; Secure' : ''}`,
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
    const validPhone = /^(?=(?:.*[0-9]){7})[+0-9() -]{7,24}$/i.test(data.customer?.phone || '');
    const validDelivery = data.deliveryMethod === 'courier'
      ? Boolean(data.customer?.name && data.customer?.city && data.customer?.address)
      : data.deliveryMethod === 'cdek'
        ? Boolean(data.customer?.name && data.customer?.surname && data.customer?.pickupAddress)
        : false;
    const customerFieldsValid = Object.values(data.customer || {}).every(value => typeof value === 'string' && value.length <= 300);
    if (!data.consent || !validPhone || !validDelivery || !customerFieldsValid || !Array.isArray(data.items) || !data.items.length || data.items.length > 100) {
      return json(res, 400, { error: 'Проверьте обязательные поля заказа' });
    }
    const calculated = [];
    for (const requested of data.items) {
      const product = db.products.find(p => String(p.id) === String(requested.id) && p.published !== false);
      const quantity = Math.max(1, Math.min(99, Number(requested.quantity) || 1));
      if (!product) return json(res, 400, { error: 'Один из товаров больше недоступен' });
      const specs = sanitizeProductSpecs(product, requested.specs || {});
      const price = getProductPrice(product, specs);
      const image = getProductImages(product, specs)[0] || product.image;
      calculated.push({ productId: product.id, name: product.name, price, quantity, image, specs });
    }
    const duplicate = db.orders.find(order =>
      Date.now() - new Date(order.createdAt).getTime() < 30_000 &&
      order.customer.phone === data.customer.phone &&
      JSON.stringify(order.items.map(i => [String(i.productId), i.quantity, i.specs || {}])) === JSON.stringify(calculated.map(i => [String(i.productId), i.quantity, i.specs || {}]))
    );
    if (duplicate) return json(res, 200, { number: duplicate.number, total: duplicate.total, duplicate: true });
    const order = {
      id: randomUUID(),
      number: `ML-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`,
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
        persistentStorage: persistentStorageEnabled(),
    storageMode: storageMode(),
      },
    });
  }
  if (path === '/api/admin/telegram-test' && req.method === 'POST') {
    const result = await sendTelegramText('MacLuck: Telegram-уведомления подключены. Это проверочное сообщение.');
    if (!result.sent) return json(res, 503, { error: 'Telegram не настроен' });
    return json(res, 200, { ok: true });
  }
  if (path === '/api/admin/settings' && req.method === 'PUT') {
    const updates = cleanRecord(await body(req));
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return json(res, 400, { error: 'Некорректные настройки' });
    db.settings = { ...db.settings, ...updates }; await save(); return json(res, 200, db.settings);
  }
  if (path === '/api/admin/upload' && req.method === 'POST') {
    const data = await body(req, 8_000_000);
    const match = String(data.data || '').match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if (!match) return json(res, 400, { error: 'Разрешены только PNG, JPEG и WEBP' });
    const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[match[1]];
    const name = `${randomUUID()}${ext}`;
    await storeUpload(name, match[1], Buffer.from(match[2], 'base64'));
    return json(res, 201, { url: `/uploads/${name}` });
  }
  if (path === '/api/admin/upload' && req.method === 'DELETE') {
    const data = await body(req);
    if (!String(data.url || '').startsWith('/uploads/')) return json(res, 400, { error: 'Можно удалить только загруженный файл' });
    const name = data.url.slice(9);
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) return json(res, 403, { error: 'Недопустимый путь' });
    await deleteUpload(name);
    return json(res, 200, { ok: true });
  }
  const match = path.match(/^\/api\/admin\/(products|categories|filters|news|banners|legal|orders)(?:\/([^/]+))?$/);
  if (match) {
    const [, collection, id] = match;
    if (req.method === 'GET') return json(res, 200, db[collection]);
    if (req.method === 'POST') {
      const item = { ...cleanRecord(await body(req)), id: randomUUID() };
      validateAdminRecord(collection, item);
      db[collection].unshift(item); await save(); return json(res, 201, item);
    }
    const index = db[collection].findIndex(item => String(item.id) === decodeURIComponent(id));
    if (index < 0) return json(res, 404, { error: 'Запись не найдена' });
    if (req.method === 'PUT') {
      const updated = { ...db[collection][index], ...cleanRecord(await body(req)), id: db[collection][index].id };
      validateAdminRecord(collection, updated, updated.id);
      db[collection][index] = updated;
      await save(); return json(res, 200, db[collection][index]);
    }
    if (req.method === 'DELETE') {
      const [removed] = db[collection].splice(index, 1); await save(); return json(res, 200, removed);
    }
  }
  return json(res, 404, { error: 'API endpoint не найден' });
}

function matchesRouteValue(item, value) {
  const normalized = String(value || '').toLowerCase();
  return String(item?.slug || '').toLowerCase() === normalized || String(item?.name || '').toLowerCase() === normalized;
}

function isKnownPage(path) {
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return true;
  try {
    const section = parts[0];
    const first = decodeURIComponent(parts[1] || '');
    const second = decodeURIComponent(parts[2] || '');
    if (section === 'admin') return true;
    if (parts.length === 2 && section === 'product') {
      return db.products.some(item => item.published !== false && (String(item.id) === first || item.slug === first));
    }
    if (parts.length === 2 && section === 'news') {
      return db.news.some(item => item.published !== false && (String(item.id) === first || item.slug === first));
    }
    if (parts.length === 2 && section === 'legal') {
      return db.legal.some(item => item.published !== false && item.slug === first);
    }
    if (parts.length === 2 && section === 'brand') {
      return db.categories.some(category => category.published !== false && (
        matchesRouteValue(category, first) || (category.children || []).some(child => child.published !== false && matchesRouteValue(child, first))
      ));
    }
    if (parts.length === 3 && section === 'category') {
      const category = db.categories.find(item => item.published !== false && matchesRouteValue(item, first));
      return Boolean(category && (category.children || []).some(child => child.published !== false && matchesRouteValue(child, second)));
    }
  } catch {}
  return false;
}

async function serveStatic(path, res) {
  if (s3Configured && path.startsWith('/uploads/')) return serveS3Upload(path, res);
  const upload = path.startsWith('/uploads/');
  const root = upload ? UPLOAD_DIR : DIST_DIR;
  let target = normalize(join(root, upload ? path.slice(9) : path === '/' ? 'index.html' : path.slice(1)));
  let statusCode = 200;
  if (target !== root && !target.startsWith(root + sep)) return json(res, 403, { error: 'Forbidden' });
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
  } catch {
    if (!upload) {
      target = join(DIST_DIR, 'index.html');
      const knownStatic = ['/', '/catalog', '/news', '/about', '/delivery', '/cart', '/search', '/favorites', '/clearance', '/privacy', '/terms', '/cookies', '/consent'];
      statusCode = knownStatic.includes(path) || isKnownPage(path) ? 200 : 404;
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
    await stat(target);
    res.writeHead(statusCode, responseHeaders({
      'content-type': types[extension] || 'application/octet-stream',
      'cache-control': cacheControl,
    }));
    createReadStream(target).pipe(res);
  } catch { json(res, 404, { error: 'Not found' }); }
}

export const server = http.createServer((req, res) => route(req, res).catch(error => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  json(res, status, { error: error.status ? error.message : 'Внутренняя ошибка сервера' });
}));
server.listen(PORT, () => console.log(`MacLuck server: http://localhost:${PORT}`));
