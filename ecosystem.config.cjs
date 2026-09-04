/** PM2 — Oilix production on Ubuntu (LAN) */
const path = require('path');

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: 'oilix-api',
      cwd: path.join(ROOT, 'api'),
      script: path.join(ROOT, 'api/dist/src/main.js'),
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oilix-web',
      cwd: path.join(ROOT, 'web'),
      script: path.join(ROOT, 'web/node_modules/next/dist/bin/next'),
      args: 'start -H 0.0.0.0 -p 3000',
      instances: 1,
      autorestart: true,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
