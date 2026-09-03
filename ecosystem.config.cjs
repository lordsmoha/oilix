/** PM2 — démarrage production Oilix sur Ubuntu (sans Docker) */
module.exports = {
  apps: [
    {
      name: 'oilix-api',
      cwd: './api',
      script: 'dist/src/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oilix-web',
      cwd: './web',
      script: 'node_modules/next/dist/bin/next',
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
