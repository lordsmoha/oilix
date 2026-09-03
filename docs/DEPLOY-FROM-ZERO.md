# Oilix — Deploy from zero (Ubuntu LAN)

Fresh install on **192.168.1.249** with project at **`/home/oilixu/oilix`**.

| Item | Value |
|------|--------|
| Server IP | `192.168.1.249` |
| Project path | `/home/oilixu/oilix` |
| Web (Nginx) | `http://192.168.1.249` |
| API (Nginx) | `http://192.168.1.249/api/v1` |
| API direct | `http://127.0.0.1:3001/api/v1` |
| Web process | `127.0.0.1:3000` |
| PostgreSQL | `localhost:5432` |
| Login after seed | `admin` / `admin123` |

---

## 0. Clean old install (optional)

Only if you want a **full wipe**:

```bash
pm2 delete all 2>/dev/null || true
pm2 save

# Keep node_modules if you want faster reinstall later — or remove everything:
sudo rm -rf /home/oilixu/oilix
mkdir -p /home/oilixu/oilix

# Optional: drop and recreate DB
sudo -u postgres psql -c "DROP DATABASE IF EXISTS oilix;"
sudo -u postgres psql -c "DROP USER IF EXISTS oilix;"
```

---

## 1. System packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw nginx
```

### Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
sudo npm install -g pm2
```

### PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Create DB user + database:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER oilix WITH PASSWORD '63049812Oilix';
CREATE DATABASE oilix OWNER oilix;
GRANT ALL PRIVILEGES ON DATABASE oilix TO oilix;
\c oilix
GRANT ALL ON SCHEMA public TO oilix;
ALTER SCHEMA public OWNER TO oilix;
SQL
```

> Change the password if you prefer — then use the same value in `api/.env`.

---

## 2. Copy the project (from Windows)

### With WinSCP

| Left (Windows) | Right (Ubuntu) |
|----------------|----------------|
| `e:\Projects\Web\Oilix\api` | `/home/oilixu/oilix/api` |
| `e:\Projects\Web\Oilix\web` | `/home/oilixu/oilix/web` |
| `e:\Projects\Web\Oilix\ecosystem.config.cjs` | `/home/oilixu/oilix/ecosystem.config.cjs` |

**Do not copy** from Windows:

- `api/node_modules`
- `web/node_modules`
- `api/dist`
- `web/.next`

### Or from PowerShell (SCP)

```powershell
scp -r e:\Projects\Web\Oilix\api oilixu@192.168.1.249:/home/oilixu/oilix/
scp -r e:\Projects\Web\Oilix\web oilixu@192.168.1.249:/home/oilixu/oilix/
scp e:\Projects\Web\Oilix\ecosystem.config.cjs oilixu@192.168.1.249:/home/oilixu/oilix/
```

On the server:

```bash
mkdir -p /home/oilixu/oilix
cd /home/oilixu/oilix
ls   # should show: api  web  ecosystem.config.cjs
```

---

## 3. Configure `api/.env`

```bash
cd /home/oilixu/oilix/api
nano .env
```

Paste **exactly** (adapt password / JWT if needed):

```env
DATABASE_URL="postgresql://oilix:63049812Oilix@localhost:5432/oilix?schema=public"

JWT_SECRET="af01e9809b5fREPLACE_WITH_openssl_rand_hex_32"
JWT_EXPIRES_IN="8h"
PORT=3001
HOST=0.0.0.0
PUBLIC_HOST=192.168.1.249

CORS_ORIGIN="http://192.168.1.249,http://192.168.1.249:3000,http://192.168.1.249:8081,exp://192.168.1.249:8081,http://localhost:3000,http://localhost:8081,exp://localhost:8081"

NODE_ENV=production
ENABLE_SWAGGER=true
```

Generate a strong JWT secret:

```bash
openssl rand -hex 32
```

Paste the result into `JWT_SECRET=` (must be **≥ 32 characters** in production).

Save: `Ctrl+O`, Enter, `Ctrl+X`.

---

## 4. Configure `web/.env.local`

```bash
cd /home/oilixu/oilix/web
nano .env.local
```

**Correct** (use one of these):

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249
PUBLIC_HOST=192.168.1.249
```

or:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.249/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249
PUBLIC_HOST=192.168.1.249
```

**Wrong** (missing `http://` — breaks login):

```env
NEXT_PUBLIC_API_URL=192.168.1.249/api/v1
```

> `NEXT_PUBLIC_*` are baked into the build. Change `.env.local` **before** `npm run build`.

---

## 5. Install, migrate, seed, build — API

```bash
cd /home/oilixu/oilix/api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Seed creates: **`admin` / `admin123`**.

---

## 6. Install & build — Web

```bash
cd /home/oilixu/oilix/web
npm ci
npm run build
```

---

## 7. Nginx (port 80)

```bash
sudo nano /etc/nginx/sites-available/oilix
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 192.168.1.249;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }

    location /realtime {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/oilix /etc/nginx/sites-enabled/oilix
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

---

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable
sudo ufw status
```

Do **not** open PostgreSQL `5432` to the LAN.

---

## 9. Start with PM2

```bash
cd /home/oilixu/oilix
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command that pm2 prints (sudo env PATH=...)
pm2 status
```

---

## 10. Verify

On the server:

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1/api/v1/health
curl -X POST http://127.0.0.1/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

On a PC browser:

1. Open `http://192.168.1.249`
2. Ctrl+F5
3. Login: `admin` / `admin123`
4. Change the admin password in `/users`

---

## One-shot script (after files + .env are ready)

```bash
cd /home/oilixu/oilix/api
npm ci && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run build

cd /home/oilixu/oilix/web
npm ci && npm run build

cd /home/oilixu/oilix
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

sudo nginx -t && sudo systemctl reload nginx

echo "OK → http://192.168.1.249  (admin / admin123)"
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login fails in browser, curl works | Rebuild web after `.env.local`: `cd web && npm run build && pm2 restart oilix-web` + Ctrl+F5 |
| CORS error | `CORS_ORIGIN` must include `http://192.168.1.249` (no port) → `pm2 restart oilix-api` |
| 502 Bad Gateway | `pm2 status` — api/web must be online |
| JWT_SECRET error on start | Secret too short — use `openssl rand -hex 32` |
| DB auth failed | Check password in `DATABASE_URL` matches PostgreSQL |
| Module not found | `npm ci` again in `api` and `web` (Linux modules, not Windows) |

---

## Ports summary

| Port | Service | LAN? |
|------|---------|------|
| 22 | SSH | Yes |
| 80 | Nginx → web + API | Yes |
| 3000 | Next.js | Optional (Nginx proxies) |
| 3001 | NestJS | Optional (Nginx proxies) |
| 5432 | PostgreSQL | **No** |

---

**Oilix** · From-zero deploy · `192.168.1.249` · `/home/oilixu/oilix`
