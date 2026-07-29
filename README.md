# MacLuck

Интернет-магазин на React/Vite с собственным Node.js backend, административной панелью, постоянным файловым хранилищем, оформлением заказов и Telegram-уведомлениями.

## Локальный запуск

Требуется Node.js 22 или новее.

1. Скопируйте `.env.example` в `.env`.
2. Замените `ADMIN_PASSWORD` и `SESSION_SECRET` на длинные случайные значения.
3. Выполните `npm ci`.
4. В первом терминале запустите `npm run server`.
5. Во втором терминале запустите `npm run dev`.
6. Сайт: `http://localhost:5173`, админка: `http://localhost:5173/admin`.

Первый запуск backend создаёт `data/database.json` и переносит в него исходные товары, категории, баннеры и новости. Этот файл не коммитится.

## Переменные окружения

- `PORT` — порт backend;
- `APP_ORIGIN` — разрешённый frontend origin;
- `PUBLIC_URL` — production-домен;
- `ADMIN_LOGIN`, `ADMIN_PASSWORD` — вход администратора;
- `SESSION_SECRET` — секрет хеширования сессий, минимум 32 случайных символа;
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — уведомления о заказах;
- `DATA_FILE` — файл постоянного хранилища;
- `UPLOAD_DIR` — каталог изображений.

## Production

1. Создайте отдельного непривилегированного пользователя сервера.
2. Установите Node.js 22+, выполните `npm ci` и `npm run build`.
3. Создайте production `.env` вне Git с `NODE_ENV=production`, HTTPS-доменом и секретами.
4. Запускайте `npm start` через systemd или другой process manager.
5. Направьте домен через Nginx на backend-порт. Backend раздаёт `dist`, `/uploads`, API, `robots.txt` и `sitemap.xml`.
6. Перед обновлением копируйте `data/database.json`, `.env` и `uploads`.
7. Проверяйте `/api/health`, публичный каталог, вход в `/admin` и тестовый заказ.

Для большого каталога файловое хранилище следует планово заменить PostgreSQL без изменения публичного API.

## Что заполнить перед публикацией

- реквизиты владельца и оператора персональных данных;
- проверенные юристом документы;
- телефон, email, адрес и часы работы;
- условия оплаты, доставки, возврата и гарантии;
- production-домен и социальные сети;
- логотип и favicon;
- Telegram bot token и chat ID.
