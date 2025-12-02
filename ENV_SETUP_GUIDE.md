# Environment Configuration Setup Guide
## Portfolix Compass Backend - Complete Setup Instructions

---

## 📋 Overview

This guide provides complete instructions for setting up environment variables for **development**, **staging**, and **production** environments.

### Environment Files Available
- `.env.example` - Template with all available variables
- `.env.development` - Development configuration (local development)
- `.env.production` - Production configuration (to be deployed)

---

## 🚀 Quick Start - Local Development

### Step 1: Copy Development Configuration
```bash
cp .env.development .env
```

### Step 2: Update MongoDB Connection (Optional)

If using local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/portfolix-compass
```

If using MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/portfolix-compass?retryWrites=true&w=majority
```

### Step 3: Verify Redis Installation

Make sure Redis is running locally:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows (WSL)
wsl sudo systemctl start redis
```

### Step 4: Start Backend Server

```bash
npm install
npm start
```

Server should be running at `http://localhost:5000`

---

## 🔧 Configuration Variables Explained

### Server Configuration
| Variable | Dev Value | Prod Value | Description |
|----------|-----------|------------|-------------|
| `NODE_ENV` | development | production | Node environment |
| `PORT` | 5000 | 5000 | Server port |
| `API_URL` | http://localhost:5000 | https://api.portfolix.in | API base URL |

### Database Configuration
| Variable | Dev Value | Prod Value | Description |
|----------|-----------|------------|-------------|
| `MONGODB_URI` | localhost:27017 | MongoDB Atlas (with SSL) | MongoDB connection string |

**Important**: Production MUST use MongoDB Atlas or secured MongoDB with SSL/TLS

### Authentication & Security
| Variable | Dev Value | Prod Value | Requirements |
|----------|-----------|------------|-------------|
| `JWT_SECRET` | dev_jwt_secret... | Strong random 32+ chars | JWT signing key |
| `BCRYPT_ROUNDS` | 10 | 12 | Security rounds for hashing |

**Security Note**: Use `openssl rand -base64 32` to generate strong secrets

### Redis Configuration
| Variable | Dev Value | Prod Value | Notes |
|----------|-----------|------------|-------|
| `REDIS_URL` | redis://localhost:6379 | rediss://...@cache.amazonaws.com | Production must use SSL (rediss://) |
| `REDIS_PASSWORD` | (empty) | Required | Password for AWS ElastiCache |

### Email Service (SendGrid)
| Variable | Required | Format |
|----------|----------|--------|
| `SENDGRID_API_KEY` | Yes (prod) | SG.xxxxxxxxxxxxxxxxxxxxx |
| `EMAIL_FROM` | Yes | noreply@portfolix.in |

### AWS S3 Configuration
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=portfolix-production-documents
```

**Important**: Use IAM user with S3-only permissions

---

## 📱 Frontend Environment Setup (.env.local)

### Create Frontend `.env.local`

```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=30000
REACT_APP_LOG_LEVEL=debug
```

### For Production Frontend

```bash
REACT_APP_API_URL=https://api.portfolix.in
REACT_APP_API_TIMEOUT=30000
REACT_APP_LOG_LEVEL=warn
```

---

## 🔐 Production Secrets Setup

### Step 1: Add GitHub Actions Secrets

Navigate to: `Settings > Secrets and variables > Actions`

Add these secrets:

```
MONGODB_PROD_URI=mongodb+srv://...
REDIS_PROD_URL=rediss://...
JWT_SECRET_PROD=<random-32-chars>
SENDGRID_API_KEY=SG...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
SENTRY_DSN=https://...
```

### Step 2: Deploy with Environment Variables

#### Using Docker Compose
```yaml
environment:
  - NODE_ENV=production
  - MONGODB_URI=${MONGODB_PROD_URI}
  - REDIS_URL=${REDIS_PROD_URL}
  - JWT_SECRET=${JWT_SECRET_PROD}
```

#### Using PM2
```javascript
module.exports = {
  apps: [{
    name: 'portfolix-backend',
    script: './src/server.js',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: process.env.MONGODB_PROD_URI,
      REDIS_URL: process.env.REDIS_PROD_URL,
    }
  }]
};
```

---

## 🏗️ MongoDB Atlas Setup

### Create Free Cluster

1. Visit https://www.mongodb.com/cloud/atlas
2. Create account or login
3. Create new project: "Portfolix Compass"
4. Build a cluster (Free tier M0)
5. Choose region: ap-south-1 (Mumbai) or ap-southeast-1
6. Wait 5-10 minutes for cluster creation

### Create Database User

1. Go to **Database Access**
2. Add new database user
3. Username: `portfolix_user`
4. Auto-generate password (save it!)
5. Set permissions: **Atlas admin** or custom role

### Whitelist IP

1. Go to **Network Access**
2. Add IP Address
3. For development: Add `0.0.0.0/0` (anyone)
4. For production: Add specific server IPs only

### Get Connection String

1. Click **Connect** on cluster
2. Choose "Connect your application"
3. Select "Node.js"
4. Copy connection string
5. Replace `<password>` and `<dbname>`

Example:
```
mongodb+srv://portfolix_user:PASSWORD@cluster0.xxxxx.mongodb.net/portfolix-compass?retryWrites=true&w=majority
```

---

## 🔴 Redis ElastiCache Setup (AWS)

### Create Redis Cluster

1. Go to AWS **ElastiCache** console
2. Choose "Redis" engine
3. Node type: `cache.t3.micro` (free tier eligible)
4. Multi-AZ: Disabled (for dev)
5. VPC: Same as app server
6. Subnet group: Default
7. Security group: Allow inbound port 6379

### Connect to Redis

```env
REDIS_URL=rediss://default:PASSWORD@xxxx.cache.amazonaws.com:6379
REDIS_PASSWORD=<auto-generated-password>
```

**Note**: Use `rediss://` (not `redis://`) for SSL/TLS

---

## ✅ Verification Checklist

### Development
- [ ] `.env` file created from `.env.development`
- [ ] MongoDB connection tested: `mongodb://localhost:27017`
- [ ] Redis running on `localhost:6379`
- [ ] Backend starts without errors on `http://localhost:5000`
- [ ] Health endpoint responds: `GET /health`

### Production
- [ ] GitHub Secrets added (all 8+ variables)
- [ ] MongoDB Atlas cluster running with SSL
- [ ] Redis ElastiCache cluster deployed
- [ ] AWS S3 bucket created with proper permissions
- [ ] Sentry project created and DSN copied
- [ ] SendGrid API key obtained
- [ ] SSL certificate obtained (Let's Encrypt or AWS)
- [ ] CI/CD pipeline configured

---

## 🚨 Security Best Practices

1. **Never commit `.env` files** (should be in .gitignore)
2. **Use strong random secrets**: `openssl rand -base64 32`
3. **Rotate secrets regularly** in production
4. **Use SSL/TLS for all connections** in production
5. **Limit MongoDB access** by IP whitelist
6. **Use IAM roles** instead of hardcoded AWS credentials
7. **Enable audit logging** for sensitive operations
8. **Use secrets manager** (AWS Secrets Manager or Vault)

---

## 📚 Useful Commands

### Generate Secure Secrets
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -hex 32     # Alternative format
```

### Test Database Connection
```bash
node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI, (e,c) => console.log(e ? 'Failed' : 'Connected'))"
```

### Test Redis Connection
```bash
node -e "require('redis').createClient(process.env.REDIS_URL).ping(err => console.log(err ? 'Failed' : 'Connected'))"
```

### List Environment Variables
```bash
env | grep -E "(NODE_ENV|MONGODB|REDIS|JWT)"
```

---

## 📞 Troubleshooting

### "Cannot connect to MongoDB"
- Check MongoDB is running
- Verify connection string format
- Ensure user has database access (MongoDB Atlas)
- Check IP whitelist (MongoDB Atlas)

### "Redis connection timeout"
- Verify Redis is running
- Check `REDIS_URL` format (rediss:// for AWS)
- Ensure security groups allow port 6379

### "JWT_SECRET is invalid"
- Must be at least 32 characters
- Use `openssl rand -base64 32` to generate
- Cannot contain special characters that break URLs

---

## 📖 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [AWS ElastiCache Redis](https://docs.aws.amazon.com/elasticache/latest/userguide/)
- [SendGrid Email API](https://sendgrid.com/docs/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated:** December 2, 2025
**Maintained by:** Backend Development Team
