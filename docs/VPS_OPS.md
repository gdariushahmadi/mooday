# DANEG VPS Operations

راهنمای عملیاتی برای سرور `162.0.231.49` که DANEG روی آن اجرا می‌شود. این سند برای on-call engineer نوشته شده.

## اتصال به سرور

```bash
# با کلید deploy (پیش‌فرض):
ssh -i ~/.ssh/mooday_vps_ed25519 root@162.0.231.49

# به‌صورت mooday (sudo بدون رمز):
ssh -i ~/.ssh/mooday_vps_ed25519 mooday@162.0.231.49
```

## سرویس‌ها و لاگ‌ها

| سرویس | systemd unit / compose service | لاگ |
|---|---|---|
| Next.js | `systemctl status mooday` | `journalctl -u mooday -f` |
| Nginx | `systemctl status nginx` | `journalctl -u nginx -f` |
| certbot renew | `systemctl list-timers` | `journalctl -u certbot.service` |
| Backup | `systemctl status mooday-backup.timer` | `journalctl -u mooday-backup -f` |
| Supabase stack | `cd /opt/mooday/supabase && docker compose ps` | `docker compose logs -f <service>` |

## restart سرویس‌ها

```bash
# Next.js
sudo systemctl restart mooday

# Nginx (بعد از تغییر config)
sudo nginx -t && sudo systemctl reload nginx

# همه‌ی Supabase stack
cd /opt/mooday/supabase
sudo docker compose restart

# فقط یک سرویس (مثلاً auth)
cd /opt/mooday/supabase
sudo docker compose restart auth
```

## deploy مجدد

```bash
# از دستگاه deploy‌کننده:
cd /Users/macbook/projects/mooday  # یا هر جایی که مخزن هست
git pull
npm run deploy:vps -- --upload
```

اگه فقط باید migrations را روی Supabase اعمال کنی (بدون redeploy Next.js):

```bash
# روی سرور:
cd /opt/mooday/supabase
scp user@devbox:/path/to/supabase/migrations/*.sql /tmp/new-migrations/
cp /tmp/new-migrations/*.sql migrations/
sudo docker compose up -d --force-recreate migrations
sudo docker logs supabase-migrations --tail=20
```

## Backup و بازیابی

### backup دستی

```bash
ssh root@162.0.231.49
sudo /usr/local/bin/daneg-backup
ls /opt/mooday/backups/daily/
```

### بازیابی DB از backup

```bash
ssh root@162.0.231.49
cd /opt/mooday/supabase

# 1. توقف سرویس‌هایی که به DB متصل هستن
sudo docker compose stop rest auth meta

# 2. پاک کردن schema ها
sudo docker exec supabase-db psql -U postgres -c "drop schema if exists public cascade; drop schema if exists auth cascade; create schema public authorization supabase_admin; create schema auth authorization supabase_auth_admin;"

# 3. بارگذاری backup
cat /opt/mooday/backups/daily/<timestamp>/postgres.sql | sudo docker exec -i supabase-db psql -U postgres

# 4. اجرای migrations app
sudo docker compose up -d auth  # GoTrue schema را پر می‌کند
sleep 10
sudo docker compose up -d --force-recreate migrations  # app migrations

# 5. راه‌اندازی همه
sudo docker compose up -d
```

### بازیابی Storage از backup

```bash
ssh root@162.0.231.49
sudo systemctl stop mooday
cd /opt/mooday/supabase
sudo docker compose stop storage
sudo rm -rf volumes/storage
sudo tar -xzf /opt/mooday/backups/daily/<timestamp>/storage.tgz -C volumes/
sudo chown -R 999:999 volumes/storage  # مالک postgres در container
sudo docker compose start storage
sudo systemctl start mooday
```

## مانیتورینگ

```bash
# مصرف منابع
ssh root@162.0.231.49
free -h
df -h
sudo docker stats --no-stream

# لاگ‌های زنده
sudo journalctl -u mooday -f
cd /opt/mooday/supabase && sudo docker compose logs -f --tail=50

# تست‌های سلامت
curl -sI https://app.daneg.ae/api/health
curl -s  https://app.daneg.ae/api/health | jq
```

## عیب‌یابی رایج

### "502 Bad Gateway" در همه‌ی endpoint ها

```bash
sudo systemctl status mooday
sudo journalctl -u mooday --no-pager -n 50
# اگه mooday فعال نیست:
sudo systemctl restart mooday
```

### "502 Bad Gateway" فقط در `/auth/v1/*` یا `/rest/v1/*`

```bash
cd /opt/mooday/supabase
sudo docker compose ps
sudo docker compose logs kong --tail=30
# Kong در حال restart است؟
sudo docker compose restart kong
```

### خطای "relation users does not exist" در auth

`auth` schema خالی شده (احتمالاً به‌خاطر restore یا drop). GoTrue باید migration‌هاش را اجرا کنه ولی گاهی در restart loop گیر می‌کنه.

```bash
cd /opt/mooday/supabase
sudo docker compose stop auth
sudo docker rm supabase-auth
# Drop کامل auth schema:
sudo docker exec supabase-db psql -U postgres -c "drop schema if exists auth cascade; create schema auth authorization supabase_auth_admin;"
# راه‌اندازی مجدد (GoTrue schema را پر می‌کند):
sudo docker compose up -d auth
sleep 15
sudo docker logs supabase-auth --tail=10
```

### خطای "policy already exists" در migration

storage container policies `storage.objects` را می‌سازد که با migration‌های app conflict داره. migration را patch کن (الگو در `scripts/build-vps.sh` مستند شده).

```bash
# روی سرور:
cd /opt/mooday/supabase/migrations
chmod +w 202608190001_fix_profile_recursion_and_avatar_storage.sql
# DROP POLICY IF EXISTS اضافه کن قبل از CREATE POLICY روی storage.objects
```

### certbot تجدید نمی‌شه

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
sudo journalctl -u certbot.service -n 20
# اگه فایروال پورت 80 رو بلاک کرده:
sudo ufw status
```

### Nginx نمی‌تونه SSL بارگذاری کنه

```bash
sudo nginx -t
sudo ls -la /etc/letsencrypt/live/app.daneg.ae/
# اگه فایل‌ها گم شدن:
sudo certbot certonly --webroot -w /var/www/html -d app.daneg.ae --non-interactive --agree-tos -m ops@daneg.ae
```

### حافظه کم (OOM)

سرور 2 GB RAM دارد. Supabase stack حدود 1 GB استفاده می‌کنه، Next.js حدود 350 MB. اگه همه چیز OOM بخوره:

```bash
free -h
sudo docker stats --no-stream
# محدود کردن Postgres shared_buffers:
# در docker-compose.yml > db > environment اضافه کن:
#   POSTGRES_INITDB_ARGS: "--shared_buffers=128MB"
```

## اسکریپت‌های مفید

```bash
# مصرف دیسک
sudo du -sh /opt/mooday/*  /var/lib/docker/*

# تعداد connection های فعال به DB
sudo docker exec supabase-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# بزرگ‌ترین جداول
sudo docker exec supabase-db psql -U postgres -c "SELECT schemaname||'.'||tablename AS table, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY pg_total_relation_size DESC LIMIT 10;"

# پاک کردن Docker (احتیاط!)
sudo docker system prune -a  # همه‌ی images و volumes و cache را پاک می‌کنه
```

## تغییر env vars

```bash
# env vars مربوط به Next.js
ssh root@162.0.231.49
sudo vim /opt/mooday/app/.env.production
sudo systemctl restart mooday

# env vars مربوط به Supabase
ssh root@162.0.231.49
cd /opt/mooday/supabase
sudo vim .env
sudo docker compose up -d --force-recreate <changed-service>
```

## آپدیت Supabase images

```bash
ssh root@162.0.231.49
cd /opt/mooday/supabase
sudo docker compose pull
sudo docker compose up -d
```

## چرخه‌ی ارتقاء

```bash
# 1. بکاپ
sudo /usr/local/bin/daneg-backup

# 2. Stop stack
cd /opt/mooday/supabase
sudo docker compose stop

# 3. ارتقاء images (مثلاً postgres 15.8.1.085 → 15.10.x)
sudo vim docker-compose.yml  # تغییر version tag
sudo docker compose pull
sudo docker compose up -d

# 4. بررسی سلامت
sleep 30
sudo docker compose ps
curl -s https://app.daneg.ae/api/health
```

## تماس

- Server host: `root@162.0.231.49`
- Domain: `app.daneg.ae`
- Owner: engineering

### صفحه لود می‌شه ولی `/_next/static/chunks/*.js` و `*.css` 404 می‌دن

Next.js standalone server از `<cwd>/.next/static/` می‌خونه assets را. اگر systemd در `/opt/mooday/app/.next/standalone` شروعش کرده، static باید در `/opt/mooday/app/.next/standalone/.next/static/` باشه، نه `/opt/mooday/app/.next/static/`.

**راه‌حل**:

```bash
ssh root@162.0.231.49
mkdir -p /opt/mooday/app/.next/standalone/.next/static
cp -R /opt/mooday/app/.next/static/. /opt/mooday/app/.next/standalone/.next/static/
chown -R mooday:mooday /opt/mooday/app/.next/standalone/.next/static
sudo systemctl restart mooday
```

`scripts/build-vps.sh` الان هر دو مسیر را در bundle قرار می‌ده پس deploy بعدی این مشکل را نخواهد داشت.

### CSS به صورت `text/plain` سرو می‌شه

معمولاً نشانه‌ی اینه که Next.js فایل `.css` را نمی‌شناسه (مسیر اشتباه). دوباره مورد بالا را بررسی کن.
