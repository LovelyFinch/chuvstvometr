module.exports = {
  apps: [
    {
      name: 'chuvstvometr-backend',
      script: './dist/index.js',
      cwd: '/opt/chuvstvometr/backend',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
