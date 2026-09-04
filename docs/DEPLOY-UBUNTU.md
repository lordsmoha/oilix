# Déploiement Oilix sur Ubuntu (réseau local, sans Docker)

> **Pour une réinstallation complète du serveur, utilisez plutôt :**  
> **[DEPLOY-FROM-ZERO.md](./DEPLOY-FROM-ZERO.md)** + **[DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md)**

Guide historique pour installer et faire tourner **Oilix** sur un serveur Ubuntu accessible en LAN.

| Paramètre | Valeur |
|-----------|--------|
| IP serveur | `192.168.1.249` |
| Web (Next.js) | `http://192.168.1.249:3000` |
| API (NestJS) | `http://192.168.1.249:3001/api/v1` |
| WebSocket | `http://192.168.1.249:3001/realtime` |
| PostgreSQL | `localhost:5432` (uniquement sur le serveur) |

---

## 1. Prérequis matériels et réseau

- Ubuntu Server **22.04 LTS** ou **24.04 LTS**
- IP fixe : **192.168.1.249** (configurée dans le routeur ou en statique sur l’interface réseau)
- Accès SSH au serveur
- Les postes clients (PC, tablettes, téléphones) sur le **même réseau local**

---

## 2. Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

---

## 3. Installation de Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # v20.x
npm -v
```

---

## 4. Installation de PostgreSQL (sans Docker)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Créer la base et l’utilisateur

```bash
sudo -u postgres psql
```

Dans `psql` :

```sql
CREATE USER oilix WITH PASSWORD '63049812Oilix';
CREATE DATABASE oilix OWNER oilix;
GRANT ALL PRIVILEGES ON DATABASE oilix TO oilix;
\q
```

> Si le mot de passe contient `@`, `#`, espaces, etc., encodez-le en URL dans `DATABASE_URL`  
> ([documentation Prisma](https://www.prisma.io/docs/reference/database-reference/connection-urls)).

Exemple de chaîne de connexion :

```env
DATABASE_URL="postgresql://oilix:63049812Oilix@localhost:5432/oilix?schema=public"
```

---

## 5. Récupérer le projet sur le serveur

### Option A — Git

```bash
mkdir -p /home/oilixu/oilix
cd /home/oilixu/oilix
git clone https://github.com/lordsmoha/oilix.git .
```

> Projet sous **`/home/oilixu/oilix`** — ne pas utiliser `/opt`.

### Option B — Copie depuis votre PC (SCP)

Depuis votre machine de développement :

```bash
scp -r e:\Projects\Web\Oilix user@192.168.1.249:/home/oilixu/oilix
```

Sur le serveur :

```bash
cd /home/oilixu/oilix
```

---

## 6. Configuration de l’API (`api/.env`)

```bash
cd /home/oilixu/oilix/api
cp .env.example .env
nano .env
```

Contenu recommandé pour le réseau local :

```env
DATABASE_URL="postgresql://oilix:VOTRE_MOT_DE_PASSE_FORT@localhost:5432/oilix?schema=public"

JWT_SECRET="GENERER_UNE_CLE_ALEATOIRE_LONGUE"
JWT_EXPIRES_IN="8h"
PORT=3001
HOST=0.0.0.0
PUBLIC_HOST=192.168.1.249

CORS_ORIGIN="http://192.168.1.249:3000,http://192.168.1.249:8081,exp://192.168.1.249:8081,http://localhost:3000,http://localhost:8081,exp://localhost:8081"

NODE_ENV=production
ENABLE_SWAGGER=true
```

Générer un `JWT_SECRET` sécurisé :

```bash
openssl rand -hex 32
```

### Installation, migrations et données initiales

```bash
cd /home/oilixu/oilix/api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

> En production, utilisez **`prisma migrate deploy`** (pas `migrate dev`).

Test manuel de l’API :

```bash
npm run start:prod
```

Vérifier depuis un autre poste du réseau :

```text
http://192.168.1.249:3001/api/v1/health
```

Réponse attendue : `{"status":"ok",...}`

Arrêter le test avec `Ctrl+C`.

---

## 7. Configuration du Web (`web/.env.local`)

```bash
cd /home/oilixu/oilix/web
cp .env.local.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=http://192.168.1.249:3001/api/v1
NEXT_PUBLIC_APP_URL=http://192.168.1.249:3000
PUBLIC_HOST=192.168.1.249
```

> **Important :** les variables `NEXT_PUBLIC_*` sont intégrées au **build**.  
> Modifiez `.env.local` **avant** `npm run build`.

```bash
cd /home/oilixu/oilix/web
npm ci
npm run build
npm run start
```

Test : `http://192.168.1.249:3000`  
Connexion par défaut après seed : `admin` / `admin123` — **changez ce mot de passe immédiatement** dans `/users`.

---

## 8. Pare-feu Ubuntu (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp    # Web
sudo ufw allow 3001/tcp    # API + WebSocket
sudo ufw enable
sudo ufw status
```

Ne pas exposer le port **5432** (PostgreSQL) au réseau.

---

## 9. Démarrage automatique avec PM2 (recommandé)

```bash
sudo npm install -g pm2
```

### Fichier `ecosystem.config.cjs` à la racine du projet

Créez `/home/oilixu/oilix/ecosystem.config.cjs` :

```javascript
module.exports = {
  apps: [
    {
      name: 'oilix-api',
      cwd: '/home/oilixu/oilix/api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oilix-web',
      cwd: '/home/oilixu/oilix/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3000',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Démarrage :

```bash
cd /home/oilixu/oilix
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Exécuter la commande affichée par pm2 startup (sudo env PATH=...)
```

Commandes utiles :

```bash
pm2 status
pm2 logs oilix-api
pm2 logs oilix-web
pm2 restart all
```

---

## 10. Application mobile (réseau local)

Sur les téléphones du réseau, l’app doit pointer vers l’API du serveur.

Fichier `mobile/.env` (sur le poste de développement Expo) :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.249:3001/api/v1
```

Et dans `mobile/app.json` → `extra.apiUrl` :

```json
"apiUrl": "http://192.168.1.249:3001/api/v1"
```

Lancer Expo en mode LAN :

```bash
cd mobile
npm install
npm run start
```

Le téléphone doit être sur le **même Wi‑Fi** que le serveur `192.168.1.249`.

---

## 11. (Optionnel) Nginx — accès sur le port 80

Si vous préférez une URL sans port pour le web :

```bash
sudo apt install -y nginx
```

Fichier `/etc/nginx/sites-available/oilix` :

```nginx
server {
    listen 80;
    server_name 192.168.1.249;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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

```bash
sudo ln -s /etc/nginx/sites-available/oilix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 80/tcp
```

> Avec Nginx, adaptez `NEXT_PUBLIC_API_URL` si vous passez par le port 80 :  
> `http://192.168.1.249/api/v1` et mettez à jour `CORS_ORIGIN` en conséquence.

---

## 12. Checklist de vérification

| Test | URL / action | Résultat attendu |
|------|----------------|------------------|
| Santé API | `http://192.168.1.249:3001/api/v1/health` | `status: ok` |
| Swagger | `http://192.168.1.249:3001/api/docs` | Documentation API |
| Web | `http://192.168.1.249:3000` | Page de connexion |
| Login | `admin` / `admin123` | Accès au tableau de bord |
| Sync temps réel | Modifier une pesée sur web | Mise à jour sans rechargement |
| Mobile | Pesée depuis l’app | Visible sur le web |

---

## 13. Mises à jour du projet

```bash
cd /home/oilixu/oilix
git pull   # ou recopier les fichiers

cd api
npm ci
npx prisma migrate deploy
npm run build

cd ../web
npm ci
npm run build

pm2 restart all
```

---

## 14. Dépannage

### « Impossible de se connecter à l’API » depuis un autre PC

- Vérifier que l’API écoute sur `0.0.0.0` : `ss -tlnp | grep 3001`
- Vérifier UFW : `sudo ufw status`
- Ping : `ping 192.168.1.249`

### Erreur CORS dans le navigateur

- Vérifier que l’URL du navigateur est bien dans `CORS_ORIGIN` de `api/.env`
- Redémarrer l’API après modification : `pm2 restart oilix-api`

### WebSocket déconnecté

- L’origine WebSocket est dérivée de `NEXT_PUBLIC_API_URL`
- Vérifier que le port **3001** est ouvert
- Si Nginx : vérifier le bloc `location /realtime` avec headers `Upgrade`

### Erreur Prisma / base de données

```bash
sudo systemctl status postgresql
psql -U oilix -d oilix -h localhost -W
```

### Le web affiche encore `localhost` dans les appels API

- Reconstruire le web **après** modification de `.env.local` :
  ```bash
  cd /home/oilixu/oilix/web && npm run build && pm2 restart oilix-web
  ```

### Mobile ne se connecte pas

- Même réseau Wi‑Fi que le serveur
- `EXPO_PUBLIC_API_URL` = `http://192.168.1.249:3001/api/v1`
- Android : `usesCleartextTraffic: true` déjà configuré dans `app.json`
- Redémarrer Expo : `npm run start`

---

## 15. Sécurité (réseau local)

- Changer le mot de passe `admin` après la première connexion
- Utiliser un `JWT_SECRET` long et unique
- Ne pas exposer PostgreSQL (port 5432) au LAN
- En production réelle (Internet), ajouter HTTPS (Let’s Encrypt) et durcir les mots de passe

---

## Résumé des ports

| Port | Service | Exposé au LAN ? |
|------|---------|-----------------|
| 22 | SSH | Oui (administration) |
| 3000 | Next.js (web) | Oui |
| 3001 | NestJS (API + WS) | Oui |
| 5432 | PostgreSQL | **Non** (localhost uniquement) |
| 80 | Nginx (optionnel) | Oui |

---

**Oilix** — إدارة معصرة الزيتون · Serveur LAN `192.168.1.249`
