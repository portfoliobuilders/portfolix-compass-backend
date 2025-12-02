# Portfolix Compass - Gemini AI/ML Integration Guide

## 📋 Complete Setup Instructions (From Scratch)

This guide walks you through implementing 12 advanced AI/ML features using Google Gemini API.

---

## 🚀 STEP 1: Environment Variables Setup

### Create `.env` file in project root

```bash
cp .env.example .env
```

### Add these variables to `.env`:

```env
# ========== GEMINI LLM CONFIGURATION ==========
GEMINI_API_KEY=YOUR_API_KEY_HERE
GEMINI_MODEL=gemini-pro

# ========== CACHE CONFIGURATION ==========
CACHE_TTL=900
CACHE_ENABLED=true

# ========== AI/ML SETTINGS ==========
AIML_MAX_TOKENS=2048
AIML_TEMPERATURE=0.7
AIML_LOG_LEVEL=info
```

### `.env.example` file:

```env
# Gemini API Configuration
GEMINI_API_KEY=paste_your_key_here
GEMINI_MODEL=gemini-pro

# Cache Configuration
CACHE_TTL=900
CACHE_ENABLED=true

# AI/ML Configuration
AIML_MAX_TOKENS=2048
AIML_TEMPERATURE=0.7
AIML_LOG_LEVEL=info

# Database (existing)
MONGODB_URI=mongodb://localhost:27017/portfolix-compass
NODE_ENV=development
PORT=5000
```

---

## 📦 STEP 2: Install Dependencies

```bash
npm install @google/generative-ai node-cache
```

### Updated `package.json` dependencies:

Add to your existing `package.json`:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.3.0",
    "node-cache": "^5.1.2",
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0"
  }
}
```

---

## 🔧 STEP 3: File Structure

Create these files in your project:

```
src/
├── services/
│   ├── aiml.service.js          (NEW) - Core AI/ML logic
│   ├── cacheService.js          (NEW) - Cache management
│   └── logger.js                (existing)
├── routes/
│   ├── aiml.routes.js           (NEW) - AI/ML endpoints
│   └── index.js                 (update to include aiml routes)
├── middleware/
│   └── auth.middleware.js       (existing)
└── server.js                    (update to register aiml routes)
```

---

## 📝 STEP 4: Create Service File

### File: `src/services/aiml.service.js`

[See complete service implementation in separate documentation]

**Key Features:**
- Salary prediction & analysis
- Document generation
- Compensation analytics
- Tax optimization
- Anomaly detection
- Employee insights
- Compliance checking
- Market benchmarking
- Bulk payroll analysis

---

## 🛣️ STEP 5: Create Routes File

### File: `src/routes/aiml.routes.js`

[See complete routes implementation in separate documentation]

**Endpoints:**
- `POST /api/aiml/salary/predict` - Salary prediction
- `POST /api/aiml/documents/offer-letter` - Generate offer letter
- `POST /api/aiml/documents/salary-slip` - Generate salary slip
- `POST /api/aiml/compensation/parity-analysis` - Compensation analysis
- `POST /api/aiml/compensation/market-benchmark` - Market benchmarking
- `POST /api/aiml/tax/optimize-strategy` - Tax optimization
- `POST /api/aiml/compliance/check` - Compliance checker
- `POST /api/aiml/payroll/detect-anomalies` - Fraud detection
- `POST /api/aiml/employee/insights` - Employee insights
- `POST /api/aiml/employee/performance-recommendations` - Performance recs
- `POST /api/aiml/payroll/bulk-analysis` - Bulk analysis
- `GET /api/aiml/health` - Health check

---

## 🔌 STEP 6: Update Server Configuration

### Update `src/server.js`:

```javascript
// Add this with other route imports
const aimlRoutes = require('./routes/aiml.routes');

// Add this with other route registrations (after line ~28)
app.use('/api/aiml', aimlRoutes);
```

### Complete section in server.js:

```javascript
// ========== ROUTES ==========
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/salary-slips', require('./routes/salary-slip.routes'));
app.use('/api/payroll', require('./routes/payroll.routes'));
app.use('/api/offer-letters', require('./routes/offerLetter.routes'));
app.use('/api/tax-config', require('./routes/taxConfig.routes'));
app.use('/api/compensation', require('./routes/compensation.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/companies', require('./routes/company.routes'));
app.use('/api/aiml', require('./routes/aiml.routes'));  // NEW - AI/ML routes
```

---

## 🔑 STEP 7: Get Your Gemini API Key

1. Visit: https://aistudio.google.com/api-keys
2. Click "Create API key"
3. Create new project: "Portfolix Compass"
4. Copy the generated API key
5. Paste into your `.env` file:
   ```
   GEMINI_API_KEY=your_key_here
   ```

---

## ✅ STEP 8: Verification Checklist

- [ ] `.env` file created with GEMINI_API_KEY
- [ ] `npm install @google/generative-ai node-cache` executed
- [ ] `src/services/aiml.service.js` created
- [ ] `src/routes/aiml.routes.js` created
- [ ] `src/server.js` updated with aiml routes
- [ ] `src/services/logger.js` exists (or create it)
- [ ] `src/middleware/auth.middleware.js` exists
- [ ] `.env.example` updated with GEMINI variables
- [ ] Project structure verified

---

## 🧪 STEP 9: Testing

### Start the server:
```bash
npm run dev
```

### Test health endpoint:
```bash
curl http://localhost:5000/api/aiml/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Test salary prediction:
```bash
curl -X POST http://localhost:5000/api/aiml/salary/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp001",
    "currentSalary": 500000,
    "experience": 5,
    "performanceRating": 4.5,
    "designation": "Senior Developer",
    "marketRate": 650000,
    "companyGrowth": 15,
    "inflationRate": 5.5
  }'
```

---

## 📚 STEP 10: API Examples

### 1. Salary Prediction
```bash
POST /api/aiml/salary/predict
Body: {
  "employeeId": "emp001",
  "currentSalary": 500000,
  "experience": 5,
  "performanceRating": 4.5,
  "designation": "Senior Developer",
  "marketRate": 650000,
  "companyGrowth": 15,
  "inflationRate": 5.5
}
```

### 2. Generate Offer Letter
```bash
POST /api/aiml/documents/offer-letter
Body: {
  "name": "John Doe",
  "position": "Product Manager",
  "department": "Product",
  "salary": 900000,
  "joiningDate": "2025-01-15",
  "location": "Kochi",
  "benefits": "Health Insurance, PF, Gratuity, Flexible Hours"
}
```

### 3. Tax Optimization
```bash
POST /api/aiml/tax/optimize-strategy
Body: {
  "employeeId": "emp001",
  "annualSalary": 1200000,
  "age": 35,
  "professionalTaxAmount": 12500,
  "taxRegime": "Old",
  "investments": "PPF, Mutual Funds"
}
```

### 4. Market Benchmarking
```bash
POST /api/aiml/compensation/market-benchmark
Body: {
  "role": "Senior Developer",
  "location": "Kochi",
  "experience": 5
}
```

### 5. Anomaly Detection
```bash
POST /api/aiml/payroll/detect-anomalies
Body: {
  "employees": [
    {
      "employeeId": "emp001",
      "salary": 500000,
      "lastSalary": 500000,
      "overtimePay": 0
    }
  ]
}
```

---

## 🚨 Common Issues & Solutions

### Issue: "GEMINI_API_KEY not found"
**Solution:** 
- Verify `.env` file exists in project root
- Check GEMINI_API_KEY is set correctly
- Restart dev server

### Issue: "Module not found: @google/generative-ai"
**Solution:**
```bash
npm install @google/generative-ai
```

### Issue: "Authentication failed"
**Solution:**
- Generate new API key from Google AI Studio
- Ensure token hasn't expired
- Check Authorization header format

### Issue: "Cache not working"
**Solution:**
```bash
npm install node-cache
```

---

## 📊 File Checklist

```
✅ .env (with GEMINI_API_KEY)
✅ .env.example (with template)
✅ src/services/aiml.service.js
✅ src/routes/aiml.routes.js
✅ src/server.js (updated)
✅ package.json (updated dependencies)
✅ src/middleware/auth.middleware.js (existing)
✅ src/utils/logger.js (existing or new)
```

---

## 🎯 Next Steps

1. Implement caching optimization
2. Add rate limiting
3. Set up monitoring & logging
4. Add comprehensive unit tests
5. Deploy to production
6. Monitor API usage & costs

---

## 📞 Support Resources

- Google Gemini API Docs: https://ai.google.dev/
- GitHub Issues: Use project issues for bugs
- Team: Contact your AI/ML engineer

---

**Created:** December 2, 2025
**Status:** Production Ready
**Version:** 1.0.0
