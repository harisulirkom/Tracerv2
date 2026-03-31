# Deploy Fullstack Tracer CDC (Tracerv2 + CDC)

Panduan ini untuk deployment production di server Linux (Ubuntu 22.04), dengan skema:
- Frontend Vue (`Tracerv2`) di `https://tracer.cdc.example.com`
- Backend Laravel (`CDC`) di `https://api.cdc.example.com`

## 1. Prasyarat Server
- Nginx
- PHP 8.2 + ekstensi umum Laravel (`mbstring`, `xml`, `curl`, `mysql`, `sqlite3`, `zip`, `bcmath`, `intl`)
- Composer 2.x
- Node.js 20+ dan npm
- MySQL/MariaDB
- SSL certbot

## 2. Ambil Source Code
```bash
sudo mkdir -p /var/www/cdc
cd /var/www/cdc

sudo git clone https://github.com/harisulirkom/Tracerv2.git frontend
sudo git clone https://github.com/harisulirkom/CDC.git backend
```

## 3. Konfigurasi Environment
1. Frontend:
```bash
cd /var/www/cdc/frontend
cp deploy/fullstack/frontend.env.production.example .env.production
```
Edit `VITE_API_BASE_URL` sesuai domain API production.

2. Backend:
```bash
cd /var/www/cdc/backend
cp /var/www/cdc/frontend/deploy/fullstack/backend.env.production.example .env
php artisan key:generate
```
Isi kredensial DB, SMTP, BREVO, `FRONTEND_URL`, dan `CORS_ALLOWED_ORIGINS`.

## 4. Build + Migrate
Jalankan script otomatis:
```bash
cd /var/www/cdc/frontend
bash deploy/fullstack/deploy-server.sh
```

Jika ingin manual:
```bash
# Frontend
cd /var/www/cdc/frontend
npm ci
npm run build

# Backend
cd /var/www/cdc/backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart || true
```

## 5. Nginx
Salin template:
```bash
sudo cp /var/www/cdc/frontend/deploy/nginx/tracerv2-frontend.conf /etc/nginx/sites-available/tracerv2-frontend.conf
sudo cp /var/www/cdc/frontend/deploy/nginx/cdc-api.conf /etc/nginx/sites-available/cdc-api.conf
```

Aktifkan:
```bash
sudo ln -s /etc/nginx/sites-available/tracerv2-frontend.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cdc-api.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL
```bash
sudo certbot --nginx -d tracer.cdc.example.com -d api.cdc.example.com
```

## 7. Scheduler dan Queue Worker
Tambahkan cron:
```bash
* * * * * cd /var/www/cdc/backend && php artisan schedule:run >> /dev/null 2>&1
```

Jalankan queue worker via systemd (contoh):
```bash
sudo tee /etc/systemd/system/cdc-queue.service >/dev/null <<'EOF'
[Unit]
Description=CDC Laravel Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/cdc/backend/artisan queue:work --sleep=3 --tries=3 --timeout=120
WorkingDirectory=/var/www/cdc/backend
StandardOutput=append:/var/log/cdc-queue.log
StandardError=append:/var/log/cdc-queue-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now cdc-queue.service
```

## 8. Smoke Test Go-Live
```bash
curl -I https://tracer.cdc.example.com
curl https://api.cdc.example.com/api/ping
curl -I https://api.cdc.example.com/api/news
```

Ekspektasi:
- Frontend return `200`
- API ping return `{"message":"API OK"}`
- Endpoint public API return `200`

## 9. Checklist Final
- `APP_DEBUG=false`
- `.env` tidak ada di repo
- DB backup aktif
- SSL aktif
- Nginx dan php-fpm aktif
- Queue worker aktif
- Cron scheduler aktif
