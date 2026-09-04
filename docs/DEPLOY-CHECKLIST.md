# Oilix — Fresh Install Checklist

Print or keep this open while reinstalling the server.

**Target:** `192.168.1.249` · `/home/oilixu/oilix` · `http://192.168.1.249`

Full guide: [DEPLOY-FROM-ZERO.md](./DEPLOY-FROM-ZERO.md)

---

## Before you start

- [ ] Ubuntu Server installed
- [ ] IP fixed: `192.168.1.249`
- [ ] SSH works: `ssh oilixu@192.168.1.249`
- [ ] Chosen DB password: `________________`
- [ ] Generated JWT: `openssl rand -hex 32` → `________________`

---

## Install order

- [ ] **1.** `apt update/upgrade` + `git curl build-essential ufw nginx openssl`
- [ ] **2.** Node.js 20 + `pm2`
- [ ] **3.** PostgreSQL + create user `oilix` + database `oilix`
- [ ] **4.** `git clone https://github.com/lordsmoha/oilix.git /home/oilixu/oilix`
- [ ] **5.** Create `api/.env` (DB password + JWT + CORS with `http://192.168.1.249`)
- [ ] **6.** Create `web/.env.local` with:

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249
PUBLIC_HOST=192.168.1.249
```

- [ ] **7.** API: `npm ci` → `prisma generate` → `migrate deploy` → `seed` → `build`
- [ ] **8.** Web: `npm ci` → `build`
- [ ] **9.** Nginx: copy `docs/nginx-oilix.conf` → enable site → `nginx -t` → reload
- [ ] **10.** UFW: allow 22, 80 (and optionally 3000/3001)
- [ ] **11.** `pm2 start ecosystem.config.cjs` → `pm2 save` → `pm2 startup`
- [ ] **12.** Tests below pass

---

## Env must-haves

### `api/.env`

```env
DATABASE_URL="postgresql://oilix:YOUR_PASSWORD@localhost:5432/oilix?schema=public"
JWT_SECRET="≥32 chars from openssl"
HOST=0.0.0.0
PUBLIC_HOST=192.168.1.249
CORS_ORIGIN="http://192.168.1.249,http://192.168.1.249:3000,http://localhost:3000"
NODE_ENV=production
```

### `web/.env.local`

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249
PUBLIC_HOST=192.168.1.249
```

**Never use:** `NEXT_PUBLIC_API_URL=192.168.1.249/api/v1` (missing `http://`)

---

## Verification

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1/api/v1/health
curl -X POST http://127.0.0.1/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
pm2 status
```

- [ ] Health OK (direct + via Nginx)
- [ ] Login returns `accessToken`
- [ ] Browser `http://192.168.1.249` loads
- [ ] Login works after Ctrl+Shift+R
- [ ] Changed admin password

---

## After first login

- [ ] Change `admin` password in `/users`
- [ ] Create season / company settings if needed
- [ ] Test oil sales workspace
- [ ] `pm2 save` already done so reboot keeps apps running

---

## Quick rebuild (later)

```bash
cd /home/oilixu/oilix && git pull
cd api && npm ci && npx prisma migrate deploy && npm run build
cd ../web && npm ci && npm run build
pm2 restart all
```
