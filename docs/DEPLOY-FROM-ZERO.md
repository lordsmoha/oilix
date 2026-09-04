# Oilix — Fresh Server Install (From Zero)

Complete guide to install **Oilix** on a **new / reinstalled** Ubuntu server.

| Setting | Value |
|---------|--------|
| Server IP | `192.168.1.249` |
| Linux user | `oilixu` (change if yours is different) |
| Project path | `/home/oilixu/oilix` |
| GitHub | `https://github.com/lordsmoha/oilix.git` |
| Public URL | `http://192.168.1.249` |
| API (via Nginx) | `http://192.168.1.249/api/v1` |
| Default login | `admin` / `admin123` |

> Follow steps **in order**. Do not skip `.env` or rebuild steps.

---

## Overview

```
Browser  →  Nginx :80  →  Next.js :3000  (web)
                     →  NestJS  :3001  (API + WebSocket)
                     →  PostgreSQL :5432 (localhost only)
```

---

## Step 1 — Ubuntu base system

SSH into the server:

```bash
ssh oilixu@192.168.1.249
```

Update packages:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw nginx openssl
```

Set a static LAN IP `192.168.1.249` in your router or Ubuntu netplan if not already done.

---

## Step 2 — Install Node.js 20 + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v    # must show v20.x
npm -v

sudo npm install -g pm2
pm2 -v
```

---

## Step 3 — Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
```

Create database user and database (choose a strong password and remember it):

```bash
sudo -u postgres psql <<'SQL'
CREATE USER oilix WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE oilix OWNER oilix;
GRANT ALL PRIVILEGES ON DATABASE oilix TO oilix;
\c oilix
GRANT ALL ON SCHEMA public TO oilix;
ALTER SCHEMA public OWNER TO oilix;
SQL
```

Test:

```bash
psql -U oilix -d oilix -h localhost -W
# then: \q
```

---

## Step 4 — Get the project from GitHub

```bash
mkdir -p /home/oilixu/oilix
cd /home/oilixu/oilix

# If folder is empty:
git clone https://github.com/lordsmoha/oilix.git .

# If folder already has files, use a clean clone instead:
# cd /home/oilixu
# rm -rf oilix
# git clone https://github.com/lordsmoha/oilix.git oilix
# cd oilix
```

Check:

```bash
ls
# expect: api  web  docs  ecosystem.config.cjs  package.json  README.md  ...
```

### Offline alternative (no GitHub on server)

From Windows with WinSCP, copy into `/home/oilixu/oilix/`:

- `api/` (exclude `node_modules`, `dist`)
- `web/` (exclude `node_modules`, `.next`)
- `ecosystem.config.cjs`
- `docs/`

---

## Step 5 — Configure API env (`api/.env`)

```bash
cd /home/oilixu/oilix/api
cp .env.example .env
nano .env
```

Paste / edit to this (replace password + JWT):

```env
DATABASE_URL="postgresql://oilix:CHANGE_THIS_PASSWORD@localhost:5432/oilix?schema=public"

JWT_SECRET="PASTE_OUTPUT_BELOW"
JWT_EXPIRES_IN="8h"
PORT=3001
HOST=0.0.0.0
PUBLIC_HOST=192.168.1.249

CORS_ORIGIN="http://192.168.1.249,http://192.168.1.249:3000,http://192.168.1.249:8081,exp://192.168.1.249:8081,http://localhost:3000,http://localhost:8081,exp://localhost:8081"

NODE_ENV=production
ENABLE_SWAGGER=true
```

Generate JWT secret (≥ 32 characters — required in production):

```bash
openssl rand -hex 32
```

Copy the output into `JWT_SECRET=`.

Save: `Ctrl+O` → Enter → `Ctrl+X`.

---

## Step 6 — Configure Web env (`web/.env.local`)

```bash
cd /home/oilixu/oilix/web
cp .env.local.example .env.local
nano .env.local
```

**Use exactly this** (Nginx same-origin — recommended):

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249
PUBLIC_HOST=192.168.1.249
```

### Wrong values (will break login)

```env
# Missing http:// — DO NOT USE
NEXT_PUBLIC_API_URL=192.168.1.249/api/v1

# Points to wrong port when using Nginx — avoid
NEXT_PUBLIC_API_URL=http://192.168.1.249:3001/api/v1
```

> `NEXT_PUBLIC_*` are baked into the Next.js build.  
> Always edit `.env.local` **before** `npm run build`.

---

## Step 7 — Build API (migrate + seed)

```bash
cd /home/oilixu/oilix/api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Seed creates:

- Username: `admin`
- Password: `admin123`

---

## Step 8 — Build Web

```bash
cd /home/oilixu/oilix/web
npm ci
npm run build
```

---

## Step 9 — Configure Nginx

```bash
sudo cp /home/oilixu/oilix/docs/nginx-oilix.conf /etc/nginx/sites-available/oilix
# Or: sudo nano /etc/nginx/sites-available/oilix  and paste from docs/nginx-oilix.conf

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/oilix /etc/nginx/sites-enabled/oilix

sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

Nginx must proxy:

| Path | Target |
|------|--------|
| `/` | `http://127.0.0.1:3000` (Next.js) |
| `/api/` | `http://127.0.0.1:3001` (NestJS) |
| `/socket.io/` | `http://127.0.0.1:3001` |
| `/realtime` | `http://127.0.0.1:3001` |

Full config file: [`nginx-oilix.conf`](./nginx-oilix.conf)

---

## Step 10 — Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable
sudo ufw status
```

Do **not** open PostgreSQL port `5432` to the LAN.

---

## Step 11 — Start with PM2

```bash
cd /home/oilixu/oilix
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the `sudo env PATH=...` command that `pm2 startup` prints, then:

```bash
pm2 status
pm2 logs --lines 50
```

Both `oilix-api` and `oilix-web` must be **online**.

---

## Step 12 — Verify

On the server:

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1/api/v1/health

curl -X POST http://127.0.0.1/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected:

- Health → `{"status":"ok",...}`
- Login → JSON with `accessToken` and `user`

On a PC in the LAN:

1. Open `http://192.168.1.249`
2. Hard refresh: **Ctrl + Shift + R**
3. Login: `admin` / `admin123`
4. Change password immediately in **Users** (`/users`)

---

## One-shot script (after Steps 1–6 are done)

```bash
cd /home/oilixu/oilix/api
npm ci && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run build

cd /home/oilixu/oilix/web
npm ci && npm run build

sudo cp /home/oilixu/oilix/docs/nginx-oilix.conf /etc/nginx/sites-available/oilix
sudo ln -sf /etc/nginx/sites-available/oilix /etc/nginx/sites-enabled/oilix
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

cd /home/oilixu/oilix
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "Open http://192.168.1.249  —  admin / admin123"
```

---

## Later updates (after first install)

```bash
cd /home/oilixu/oilix
git pull

cd api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

cd ../web
# confirm .env.local still correct
npm ci
npm run build

cd ..
pm2 restart all
```

Then Ctrl+F5 in the browser.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Login fails, curl login works | Wrong web env or old build → fix `web/.env.local` → `npm run build` → `pm2 restart oilix-web` → Ctrl+F5 |
| Toast: HTML بدل JSON | Nginx `/api/` not proxying to `:3001` → check `nginx -t` and `pm2 status` |
| CORS in browser console | `CORS_ORIGIN` must include `http://192.168.1.249` → `pm2 restart oilix-api` |
| 502 Bad Gateway | API/web down → `pm2 status` / `pm2 logs` |
| JWT_SECRET error on API start | Secret too short → `openssl rand -hex 32` → restart API |
| DB connection failed | Password in `DATABASE_URL` must match PostgreSQL user |
| `module not found` | Never copy Windows `node_modules` — run `npm ci` on Ubuntu |
| Page shows old version | Rebuild web + hard refresh |

Useful commands:

```bash
pm2 status
pm2 logs oilix-api
pm2 logs oilix-web
sudo systemctl status nginx
sudo systemctl status postgresql
ss -tlnp | grep -E '80|3000|3001'
```

---

## Ports

| Port | Service | Open to LAN? |
|------|---------|--------------|
| 22 | SSH | Yes |
| 80 | Nginx (web + API proxy) | Yes |
| 3000 | Next.js | Optional |
| 3001 | NestJS API | Optional |
| 5432 | PostgreSQL | **No** |

---

## Security checklist (after install)

- [ ] Change `admin` password
- [ ] Strong unique `JWT_SECRET`
- [ ] Strong PostgreSQL password
- [ ] PostgreSQL not exposed to LAN
- [ ] UFW enabled with SSH allowed

---

## Related files

| File | Purpose |
|------|---------|
| [`DEPLOY-CHECKLIST.md`](./DEPLOY-CHECKLIST.md) | Short checkbox list |
| [`nginx-oilix.conf`](./nginx-oilix.conf) | Nginx site config |
| [`UPDATE-DEPLOYMENT.md`](./UPDATE-DEPLOYMENT.md) | Overwrite update (no Git) |
| `../ecosystem.config.cjs` | PM2 process config |
| `../api/.env.example` | API env template |
| `../web/.env.local.example` | Web env template |

---

**Oilix** — Fresh Ubuntu install · `192.168.1.249` · `/home/oilixu/oilix`
