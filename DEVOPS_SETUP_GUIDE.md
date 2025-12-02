# DevOps Setup Guide - Portfolix Compass Backend

## Complete Production Deployment Configuration

This guide covers all DevOps enhancements: NGINX, PM2, environment configs, and migrations.

---

## 1. ENVIRONMENT CONFIGURATIONS

### Development (.env.development)
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/payroll_dev
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
JWT_EXPIRY=7d
MAX_REQUEST_SIZE=10mb
API_RATE_LIMIT_WINDOW=15m
API_RATE_LIMIT_MAX=1000
```

### Staging (.env.staging)
```bash
NODE_ENV=staging
PORT=5001
MONGODB_URI=mongodb://mongo-staging:27017/payroll_staging
REDIS_HOST=redis-staging
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD_STAGING}
LOG_LEVEL=info
CORS_ORIGIN=https://staging-payroll.portfoliobuilders.com
JWT_EXPIRY=3d
MAX_REQUEST_SIZE=20mb
API_RATE_LIMIT_WINDOW=15m
API_RATE_LIMIT_MAX=500
SENTRY_DSN=${SENTRY_DSN_STAGING}
```

### Production (.env.production)
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster.mongodb.net/payroll_prod?retryWrites=true&w=majority
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
LOG_LEVEL=warn
CORS_ORIGIN=https://payroll.portfoliobuilders.com
JWT_EXPIRY=1d
MAX_REQUEST_SIZE=20mb
API_RATE_LIMIT_WINDOW=15m
API_RATE_LIMIT_MAX=100
SENTRY_DSN=${SENTRY_DSN}
NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
```

---

## 2. NGINX SETUP

### Installation
```bash
# Ubuntu/Debian
sudo apt-get install nginx

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configuration
```bash
# Copy nginx.conf to NGINX config directory
sudo cp nginx.conf /etc/nginx/sites-available/payroll-api
sudo ln -s /etc/nginx/sites-available/payroll-api /etc/nginx/sites-enabled/

# Update server_name in nginx.conf with your domain
sudo nano /etc/nginx/sites-available/payroll-api

# Test NGINX config
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### SSL Certificate Setup (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d payroll.portfoliobuilders.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Cache Directory Setup
```bash
# Create cache directories
sudo mkdir -p /var/cache/nginx/payroll
sudo mkdir -p /var/cache/nginx/api
sudo chown -R www-data:www-data /var/cache/nginx
sudo chmod -R 755 /var/cache/nginx
```

---

## 3. PM2 SETUP

### Installation
```bash
npm install -g pm2
pm2 install pm2-logrotate
```

### Starting Services
```bash
# Development
pm2 start ecosystem.config.js --env development

# Staging
pm2 start ecosystem.config.js --env staging

# Production
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup systemd -u deploy --hp /home/deploy
pm2 save
```

### Common Commands
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs payroll-api
pm2 logs payroll-api --lines 200 --err

# Reload gracefully
pm2 reload ecosystem.config.js

# Hard restart
pm2 restart ecosystem.config.js

# Stop all
pm2 stop ecosystem.config.js

# View process info
pm2 show payroll-api
pm2 list

# Get memory usage
pm2 monit payroll-api
```

---

## 4. DATABASE MIGRATIONS

### Migration Setup
```bash
# Install migration tool
npm install migrate-mongo

# Create migrations directory
mkdir -p db/migrations

# Create migrate-mongo config
npx migrate-mongo init
```

### Migration Files Structure
```javascript
// db/migrations/001_create_organizations.js
module.exports = {
  async up(db, client) {
    await db.collection('organizations').createIndex({ orgCode: 1 }, { unique: true });
    await db.collection('organizations').createIndex({ email: 1 });
  },
  async down(db, client) {
    await db.collection('organizations').dropIndex('orgCode_1');
    await db.collection('organizations').dropIndex('email_1');
  }
};
```

### Migration Commands
```bash
# Create new migration
npx migrate-mongo create create_users_collection

# Run pending migrations
npx migrate-mongo up

# Run migrations with env
NODE_ENV=production npx migrate-mongo up

# Rollback last migration
npx migrate-mongo down

# Check migration status
npx migrate-mongo status
```

---

## 5. MONITORING & LOGGING

### Log Rotation with PM2
```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure rotation (rotate daily, keep 30 days)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Sentry Integration
```bash
# Install Sentry
npm install @sentry/node

# Set SENTRY_DSN environment variable
export SENTRY_DSN=https://key@sentry.io/project-id
```

### New Relic Integration
```bash
# Install New Relic
npm install newrelic

# Create newrelic.js configuration
# Add to top of server.js: require('newrelic');
```

---

## 6. DEPLOYMENT PROCESS

### Pre-Deployment Checklist
- [ ] All tests passing (npm test)
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Database backups taken
- [ ] Load testing completed
- [ ] Security scan passed

### Deployment Steps
```bash
# 1. Connect to server
ssh deploy@payroll.portfoliobuilders.com

# 2. Navigate to app directory
cd /var/www/payroll-api

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm install --production

# 5. Run migrations
NODE_ENV=production npm run migrate

# 6. Rebuild assets if needed
npm run build

# 7. Reload PM2
pm2 reload ecosystem.config.js --env production

# 8. Verify deployment
curl https://payroll.portfoliobuilders.com/health
```

### Rollback Procedure
```bash
# 1. Stop current version
pm2 stop payroll-api

# 2. Checkout previous version
git checkout HEAD~1

# 3. Install dependencies
npm install --production

# 4. Rollback database migrations (if needed)
NODE_ENV=production npm run migrate:down

# 5. Start services
pm2 start ecosystem.config.js --env production

# 6. Verify
curl https://payroll.portfoliobuilders.com/health
```

---

## 7. SECURITY CHECKLIST

- [ ] HTTPS/SSL enabled on all endpoints
- [ ] HSTS headers configured
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Environment variables secured in .env
- [ ] Database credentials encrypted
- [ ] API keys rotated regularly
- [ ] Security updates applied
- [ ] Firewall configured
- [ ] Backup strategy implemented

---

## 8. PERFORMANCE TUNING

### NGINX Optimization
```nginx
# Increase worker connections
worker_connections 4096;

# Enable gzip compression
gzip on;
gzip_min_length 1024;

# Cache static assets
proxy_cache_valid 200 1d;
```

### PM2 Optimization
```javascript
// ecosystem.config.js
max_memory_restart: '500M',
node_args: '--max-old-space-size=2048',
```

### Database Optimization
```javascript
// Create indexes
db.organizations.createIndex({ orgCode: 1 }, { unique: true });
db.employees.createIndex({ organizationId: 1, status: 1 });
```

---

## 9. MONITORING COMMANDS

```bash
# System monitoring
top
htop
df -h

# Process monitoring
pm2 monit
pm2 list
pm2 show payroll-api

# Log monitoring
pm2 logs payroll-api --lines 100
tail -f logs/payroll_access.log
tail -f logs/error.log

# Network monitoring
netstat -tlnp
ss -tlnp | grep 5001

# Database monitoring
mongo
use payroll_prod
db.organizations.countDocuments()
db.employees.countDocuments()
```

---

## 10. TROUBLESHOOTING

### NGINX Issues
```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/payroll_error.log

# Reload NGINX
sudo systemctl reload nginx
```

### PM2 Issues
```bash
# Check process status
pm2 show payroll-api

# View error logs
pm2 logs payroll-api --err

# Restart process
pm2 restart payroll-api

# Clear PM2 cache
pm2 flush
pm2 resurrect
```

### Database Issues
```bash
# Check MongoDB connection
mongo $MONGODB_URI

# Check indexes
db.organizations.getIndexes()

# Rebuild indexes
db.organizations.reIndex()
```

---

## Contact & Support

For DevOps issues, contact: devops@portfoliobuilders.com
For backend issues, contact: backend-team@portfoliobuilders.com
