module.exports = {
  apps: [
    {
      name: 'biosync-server',
      cwd: './server',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 6446,
      },
    },
    {
      name: 'biosync-ai-engine',
      cwd: './ai-engine',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000 --workers 2',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ENVIRONMENT: 'production',
      },
    },
  ],
};
