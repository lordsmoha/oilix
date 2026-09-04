# Oilix — Olive Press Management System

Oilix manages olive reception, processing, pressing, oil sales (stored + farmer oil), stock, and reports.

## Stack

- **API** — NestJS + Prisma + PostgreSQL (`api/`)
- **Web** — Next.js (`web/`)
- **Mobile** — Expo (`mobile/`)
- **Filtration** — Expo companion (`filtration/`)

## Local development (Windows)

1. PostgreSQL running locally  
2. Copy env files:

```powershell
copy api\.env.example api\.env
copy web\.env.local.example web\.env.local
```

3. Install & run:

```powershell
cd api
npm install
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev

# other terminal
cd web
npm install
npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001/api/v1  
- Login after seed: `admin` / `admin123`

## Production deploy (Ubuntu LAN)

Server: **192.168.1.249** · path: **`/home/oilixu/oilix`**

**Fresh server / reinstall (start here):**

- Full guide: **[docs/DEPLOY-FROM-ZERO.md](docs/DEPLOY-FROM-ZERO.md)**
- Checklist: **[docs/DEPLOY-CHECKLIST.md](docs/DEPLOY-CHECKLIST.md)**
- Docs index: **[docs/README.md](docs/README.md)**

### Critical `web/.env.local` values (Nginx)

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249
PUBLIC_HOST=192.168.1.249
```

Do **not** use `NEXT_PUBLIC_API_URL=192.168.1.249/api/v1` (missing `http://`).

## License

Private / UNLICENSED
