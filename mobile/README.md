# Oilix Mobile

Application mobile (Expo) pour la réception des olives sur le terrain.

## Prérequis

- Node.js 20+
- API Oilix en cours d'exécution (`npm run dev:api` depuis la racine)
- Expo Go sur le téléphone (réseau local) ou émulateur Android/iOS

## Configuration

```bash
cp .env.example .env
# Modifier EXPO_PUBLIC_API_URL avec l'IP de votre machine (pas localhost sur téléphone réel)
```

Sur l'API, ajouter l'origine Expo dans `CORS_ORIGIN` si besoin :

```
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,exp://192.168.1.10:8081
```

## Lancement

```bash
npm install
npm run start
```

Depuis la racine du monorepo : `npm run dev:mobile`

## Fonctionnalités

- Connexion JWT (mêmes comptes que le web)
- Tableau clients agrégé par type d'olive (vert / zbouch / mûr)
- Ajout zبون + وزنة (`POST /mobile/intake`)
- Historique des pesées par client
- Synchronisation temps réel avec le web (même base, saison active)
- Notifications web automatiques à chaque ajout depuis le mobile

## Permissions requises

`OLIVE_WRITE` et `CLIENTS_WRITE` pour l'ajout.
