# Oilix – Filtration d'Huile

Application mobile indépendante pour la gestion des opérations de **تصفية الزيت**, branchée sur la même API / base Oilix.

## Fonctionnalités

- Saisie : رقم، اسم الزيات، المنطقة، الكمية (لتر)، الخلاف، ملاحظات
- Recherche par رقم أو اسم
- Enregistrement / modification / suppression (droits `FILTRATION_WRITE`)
- Historique avec filtres (اسم، منطقة، تاريخ)
- Sync temps réel Socket.IO (`entity: filtration`)
- Audit : utilisateur + date/heure création & modification
- Police Cairo + design Oilix

## Démarrage

```bash
# API (déjà dans le monorepo)
cd api && npm run start:dev

# App Filtration
cd filtration
npm install
npm start
```

Compte : mêmes identifiants Oilix (`admin` / `admin123`).  
Permissions : `FILTRATION_READ` / `FILTRATION_WRITE` (incluses pour ADMIN et OPERATOR après seed).

## API

| Méthode | Route | Permission |
|---------|-------|------------|
| GET | `/filtration` | READ |
| GET | `/filtration/next-reference` | READ |
| GET | `/filtration/by-ref/:n` | READ |
| POST | `/filtration` | WRITE |
| PATCH | `/filtration/:id` | WRITE |
| DELETE | `/filtration/:id` | WRITE |

Écran web équivalent : `/filtration` dans l’app web Oilix.
