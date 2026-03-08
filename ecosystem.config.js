// PM2 Ecosystem Config
// Manages both Next.js apps as persistent background services.
//
// Usage on EC2:
//   pm2 start ecosystem.config.js
//   pm2 save          <- persist across reboots
//   pm2 startup       <- generate systemd service

module.exports = {
  apps: [
    {
      name: "pillmate-app",
      cwd: "./pillmate",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      // Build first with: npm run build (inside pillmate/)
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "pillmate-landing",
      cwd: "./landing_page",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      // Build first with: npm run build (inside landing_page/)
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Overridden at build time via .env.production — see deploy.sh
      },
    },
  ],
};
