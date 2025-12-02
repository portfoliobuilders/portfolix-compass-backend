// PM2 Ecosystem Configuration for Portfolix Compass Backend
// Production process management with clustering, monitoring, and auto-restart

module.exports = {
  apps: [
    {
      // App 1: Main API Server
      name: 'payroll-api',
      script: './src/server.js',
      instances: 'max', // Auto-scale based on CPU cores
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      // Performance tuning
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      watch: false, // Disable watch in production
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Restart policies
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      
      // Graceful shutdown
      shutdown_delay: 5000, // 5 second graceful shutdown
      kill_timeout: 10000, // Force kill after 10 seconds
      
      // Process communication
      merge_logs: false,
      output: './logs/out.log',
      error: './logs/error.log',
      
      // Advanced
      exp_backoff_restart_delay: 100,
      time_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      node_args: '--max-old-space-size=2048',
    },
    
    {
      // App 2: Background Worker (optional)
      name: 'payroll-worker',
      script: './src/workers/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      watch: false,
      output: './logs/worker-out.log',
      error: './logs/worker-error.log',
      autorestart: true,
    },
  ],
  
  // Deploy configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'payroll.portfoliobuilders.com',
      ref: 'origin/main',
      repo: 'https://github.com/portfoliobuilders/portfolix-compass-backend.git',
      path: '/var/www/payroll-api',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production"',
      ssh_options: 'StrictHostKeyChecking=no',
    },
    staging: {
      user: 'deploy',
      host: 'staging-payroll.portfoliobuilders.com',
      ref: 'origin/develop',
      repo: 'https://github.com/portfoliobuilders/portfolix-compass-backend.git',
      path: '/var/www/payroll-api-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      ssh_options: 'StrictHostKeyChecking=no',
    },
  },
};

/*
  PM2 Usage:
  
  # Start with PM2
  pm2 start ecosystem.config.js
  
  # Start specific environment
  pm2 start ecosystem.config.js --env production
  pm2 start ecosystem.config.js --env staging
  pm2 start ecosystem.config.js --env development
  
  # Reload (graceful shutdown + restart)
  pm2 reload ecosystem.config.js
  
  # Restart (hard restart)
  pm2 restart ecosystem.config.js
  
  # Stop all processes
  pm2 stop ecosystem.config.js
  
  # Delete from PM2 list
  pm2 delete ecosystem.config.js
  
  # Monitor in real-time
  pm2 monit
  
  # View logs
  pm2 logs payroll-api
  pm2 logs payroll-api --lines 100
  pm2 logs payroll-api --err
  
  # Deploy
  pm2 deploy ecosystem.config.js production
  pm2 deploy ecosystem.config.js staging
  
  # Save PM2 process list
  pm2 save
  
  # Resurrect PM2 process list after server restart
  pm2 resurrect
  
  # Remove all processes
  pm2 flush
  
  # Get info about apps
  pm2 info payroll-api
  pm2 pid payroll-api
  pm2 show payroll-api
*/
