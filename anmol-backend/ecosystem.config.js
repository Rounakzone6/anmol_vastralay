module.exports = {
  apps: [
    {
      name: 'anmol-backend',
      script: 'dist/src/main.js',
      // 'max' automatically scales worker processes to match available CPU cores
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
    },
  ],
};
