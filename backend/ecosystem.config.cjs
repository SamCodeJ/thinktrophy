module.exports = {
  apps: [
    {
      name: 'thinktrophy-api',
      script: 'src/server.js',
      cwd: __dirname,
      // Stay at 1 on a 1-vCPU VPS. After Redis is running, raise this on a 4+ CPU box.
      instances: Number(process.env.PM2_INSTANCES || 1),
      exec_mode: process.env.PM2_INSTANCES > 1 ? 'cluster' : 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '900M',
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: '8',
        NODE_OPTIONS: '--max-old-space-size=768',
      },
    },
  ],
};
