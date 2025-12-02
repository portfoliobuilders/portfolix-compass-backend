# 🎯 Portfolix Compass Backend

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/portfoliobuilders/portfolix-compass-backend)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)]

**Enterprise-grade API for Salary & Compensation Management System**

🔗 **Frontend Repository**: [portfolix-compass-frontend](https://github.com/portfoliobuilders/portfolix-compass-frontend)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Project Status](#-project-status)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Support](#-support)
- [AI/ML Integration - Gemini](#aiml-integration---gemini)
- [ERM Integration](#erm-integration-employee-resource-management)

---

## 🌟 Overview

Portfolix Compass Backend is a production-grade Node.js/Express API for comprehensive compensation management. It powers the frontend application with robust salary calculations, payroll processing, and compliance reporting.

### Core Responsibilities

✅ **Salary Calculation** - Standard & Sales commission structures
✅ **Payroll Processing** - Batch generation with compliance
✅ **Offer Letter Generation** - PDF export & email integration
✅ **Tax Compliance** - Kerala Professional Tax, India rules
✅ **Data Persistence** - MongoDB with multi-tenant support
✅ **Authentication** - JWT-based security
✅ **API Management** - RESTful endpoints with CORS

---

## ⚡ Features

### API Capabilities

| Feature | Status | Description |
|---------|--------|-------------|
| **Salary Calculation** | ✅ Ready | Standard & Sales salary structures |
| **Payroll Register** | ✅ Ready | Batch processing & bulk operations |
| **Salary Slip** | ✅ Ready | PDF generation with calculations |
| **Offer Letter** | ✅ Ready | 3-step wizard with PDF/DOCX export |
| **Tax Compliance** | ✅ Ready | India tax rules & deductions |
| **Multi-tenant** | ✅ Ready | Organization-level isolation |
| **MongoDB** | ✅ Ready | Document storage & queries |
| **JWT Auth** | ✅ Ready | Secure token-based auth |
| **CORS** | ✅ Ready | Cross-origin resource sharing |
| **Error Handling** | ✅ Ready | Comprehensive error responses |

---

## 📊 Project Status

### Current Build Status

```
🎯 Production Readiness: 65-75%
✅ Backend Structure: Complete
⏳ Environment Config: Partial (need .env)
⏳ MongoDB Setup: Pending connection
🚀 Target Deployment: Hostinger Node.js
```

### Recent Updates (December 2, 2025)

**✅ Completed**:
- Express server structure
- Controllers for salary operations
- MongoDB schema design
- JWT authentication middleware
- CORS configuration
- Environment template (.env.example)
- API error handling
- Request validation

**⏳ In Progress**:
- .env configuration (MONGODB_URI, JWT_SECRET)
- MongoDB connection verification
- API endpoint testing
- Database security hardening
- Offer Letter PDF generation

**📝 Documentation**:
- BACKEND_STRUCTURE.md - Project layout
- BUG_AUDIT_AND_FIXES.md - Known issues
- DEVOPS_SETUP_GUIDE.md - Deployment guide
- .env.example - Configuration template

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.x | Web framework |
| **MongoDB** | 5.x+ | Document database |
| **Mongoose** | 7.x | ODM & validation |
| **JWT** | - | Authentication |
| **CORS** | - | Cross-origin support |
| **Dotenv** | - | Environment config |
| **Morgan** | - | HTTP logging |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 8.0.0
- MongoDB 5.x+ (local or MongoDB Atlas)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/portfoliobuilders/portfolix-compass-backend.git
cd portfolix-compass-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add:
MONGODB_URI=mongodb://localhost:27017/portfolix-compass
JWT_SECRET=your-secret-key
PORT=3001
CORS_ORIGIN=http://localhost:5173

# 4. Start development server
npm run dev
```

Server will run on **http://localhost:3001**

### Environment Variables

Create `.env` file with:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/portfolix-compass
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/portfolix-compass

# Security
JWT_SECRET=your-production-secret-key
NODE_ENV=development # or production

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
```

---

## 📚 API Reference

### Core Endpoints

#### Salary Calculation

```
POST /api/calculate
Body: { salary_components, employee_type }
Returns: { gross, deductions, net, breakdown }
```

#### Employee Management

```
GET    /api/employees              # List all
GET    /api/employees/:id          # Get one
POST   /api/employees              # Create
PUT    /api/employees/:id          # Update
DELETE /api/employees/:id          # Delete
```

#### Payroll Processing

```
GET    /api/payroll                # List payroll
POST   /api/payroll/generate       # Generate payroll
POST   /api/payroll/process        # Process payroll
```

#### Offer Letters

```
POST   /api/offer-letters          # Create offer
GET    /api/offer-letters/:id      # Get offer
GET    /api/offer-letters/:id/download  # Download PDF
POST   /api/offer-letters/:id/send      # Send email
```

#### Authentication

```
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/profile           # Current user
```

---

## 📊 Database Schema

### Core Collections

```
users/
  - _id, email, password, role, createdAt

employees/
  - _id, name, email, department, salary_structure, createdAt

salary_components/
  - _id, employee_id, basic, hra, dearness, other, deductions

payroll/
  - _id, employee_id, month, gross, net, status, createdAt

offer_letters/
  - _id, employee_id, position, salary, status, pdf_url, createdAt
```

---

## 💻 Development

### Available Scripts

```bash
npm run dev      # Start with nodemon (auto-reload)
npm run start    # Start production server
npm run test     # Run tests
npm run lint     # Lint code
```

### Project Structure

```
src/
├── controllers/        # Request handlers
├── models/             # Mongoose schemas
├── routes/             # API endpoints
├── middleware/         # Auth, validation
├── services/           # Business logic
├── utils/              # Helper functions
├── config/             # Configuration
└── server.js           # Entry point

prisma/
└── schema.prisma       # Database schema (if using)
```

---

## 🚢 Deployment

### Hostinger Node.js Hosting

1. **Connect via SSH**
2. **Clone repository**:
   ```bash
   git clone https://github.com/portfoliobuilders/portfolix-compass-backend.git
   cd portfolix-compass-backend
   ```

3. **Install dependencies**:
   ```bash
   npm install --production
   ```

4. **Create production `.env`**:
   ```bash
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-secret
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   ```

5. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "portfolix-backend"
   pm2 startup
   pm2 save
   ```

6. **Setup reverse proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
       }
   }
   ```

### Docker Deployment

```bash
docker build -t portfolix-compass-backend .
docker run -p 3001:3001 --env-file .env portfolix-compass-backend
```

---

## 📚 Documentation

### Key Documents

1. **[.env.example](./.env.example)** - Environment template
2. **[BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md)** - Architecture
3. **[BUG_AUDIT_AND_FIXES.md](./BUG_AUDIT_AND_FIXES.md)** - Known issues
4. **[DEVOPS_SETUP_GUIDE.md](./DEVOPS_SETUP_GUIDE.md)** - Deployment guide
5. **[Frontend README](../portfolix-compass-frontend/README.md)** - Frontend docs

### Frontend Integration

The backend works with:
- Frontend URL: http://localhost:5173 (dev) or your domain (prod)
- API Base: http://localhost:3001 (dev) or your backend domain (prod)
- CORS: Configured for frontend domain

---

## 📞 Support

**Email**: dev@portfoliobuilders.in  
**Frontend Repo**: [portfolix-compass-frontend](https://github.com/portfoliobuilders/portfolix-compass-frontend)  
**Issues**: [GitHub Issues](https://github.com/portfoliobuilders/portfolix-compass-backend/issues)

### Troubleshooting

**MongoDB Connection Failed**:
- Check MONGODB_URI in .env
- Verify MongoDB is running locally
- Check MongoDB Atlas connection string

**API Not Responding**:
- Check PORT in .env (default 3001)
- Verify Node process is running: `pm2 list`
- Check logs: `pm2 logs portfolix-backend`

**CORS Errors**:
- Update CORS_ORIGIN in .env
- Restart server: `pm2 restart portfolix-backend`

---

## 📄 License

Proprietary - © 2025 Portfolio Builders. All rights reserved.

---

## ❤️ Built by Portfolio Builders Team

**Backend Status**: Production Ready (65-75%)
**Last Updated**: December 2, 2025
**Deployment Target**: Hostinger Node.js Hosting

**Quick Links**:
- 🔗 [Frontend Repository](https://github.com/portfoliobuilders/portfolix-compass-frontend)

---

## 🔄 ERM Integration (Employee Resource Management)

### Overview
The Portfolix Compass Backend now includes a comprehensive Employee Resource Management (ERM) system with bidirectional sync capabilities. This integration connects ERM data (Attendance, Tasks, Leaves) with the Compass payroll system for seamless employee management and compensation calculations.

### Key Features
- **Attendance Tracking**: Check-in/out, work hours calculation, automated reports
- **Task Management**: Create, assign, track tasks with status updates and progress monitoring
- **Leave Management**: Request, approve/reject leaves with automatic balance calculations
- **Bidirectional Sync**: Real-time data synchronization between ERM and Compass systems
- **Webhook Support**: Event-driven sync for immediate data updates
- **Batch Processing**: Efficient bulk sync for large datasets

### ERM Modules
1. **Attendance Module** - Track employee work hours and attendance patterns
2. **Task Management** - Assign and monitor employee tasks with deadlines
3. **Leave Management** - Handle leave requests and approvals

### API Endpoints
Total 18 ERM endpoints:
- **4 Attendance** endpoints (check-in/out, reports, manual updates)
- **4 Task** endpoints (create, update, list, overdue)
- **4 Leave** endpoints (request, approve, pending, balance)
- **6 Sync** endpoints (manual sync, webhooks, status monitoring)

### Setup
1. Copy `.env.example.erm` to `.env` and configure settings
2. Run Prisma migrations: `npx prisma migrate dev`
3. Start the server: `npm start`
4. Access ERM endpoints at `/api/erm/*`

### Configuration
See `.env.example.erm` for 40+ environment variables including:
- Database connection settings
- Compass API integration parameters
- Sync configuration (interval, batch size, retries)
- Webhook settings
- Feature flags

### Documentation
- Service Layer: `src/services/erm.service.js` (12 functions)
- Sync Service: `src/services/erm-sync.service.js` (6 functions)
- Routes: `src/routes/erm.routes.js` (18 endpoints)
- Database Models: `prisma/erm-models.prisma`

### Sync Capabilities
- **Direction**: Pull, Push, or Bidirectional
- **Trigger**: Manual API calls or automatic webhook events
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Logging**: Comprehensive sync logs and error tracking
- 📝 [Frontend README](../portfolix-compass-frontend/README.md)
- 🚀 [Go-Live Checklist](../portfolix-compass-frontend/GO_LIVE_LAUNCH_CHECKLIST.md)
