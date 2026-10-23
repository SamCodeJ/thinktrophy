module.exports = {
  apps: [
    {
      name: 'thinktrophy-api',
      script: 'src/server.js',
      cwd: __dirname,
      // KVM 4: 3 API workers, leave 1 vCPU for Postgres. Override with PM2_INSTANCES.
      instances: Number(process.env.PM2_INSTANCES || 3),
      exec_mode: Number(process.env.PM2_INSTANCES || 3) > 1 ? 'cluster' : 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: '8',
        NODE_OPTIONS: '--max-old-space-size=1536',
      },
    },
  ],
};
