module.exports = {
  apps: [
    {
      name: 'nextjs-api',
      script: 'npm',
      args: 'run start:8009',
      env: {
        NODE_ENV: 'production'
      },
      time: true
    },
    {
      name: 'exotel-ws',
      script: 'npm',
      args: 'run ws',
      env: {
        NODE_ENV: 'production',
        STT_CHUNK_BYTES: '8000',
        EXOTEL_GREETING: ''
      },
      time: true
    }
  ]
};
