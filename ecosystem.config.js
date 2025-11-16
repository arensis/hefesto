module.exports = {
  apps: [
    {
      name: 'hefesto',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: '27017',
        DATABASE_NAME: 'mongo-kairos',
      },
    },
  ],
};
