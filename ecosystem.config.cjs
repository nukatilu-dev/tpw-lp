module.exports = {
  apps: [
    {
      name: "tpw-lp",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 0.0.0.0 --port 3210",
      interpreter: process.execPath,
      env: {
        NODE_ENV: "production"
      },
      autorestart: true,
      max_restarts: 10,
      time: true
    }
  ]
}
