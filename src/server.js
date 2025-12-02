require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolix-compass';
mongoose.connect(mongoUri, {  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ Connected to MongoDB');
}).catch((err) => {
  console.error('✗ MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/salary-slips', require('./routes/salary-slip.routes'));
app.use('/api/payroll', require('./routes/payroll.routes'));
app.use('/api/offer-letters', require('./routes/offerLetter.routes'));
app.use('/api/tax-config', require('./routes/taxConfig.routes'));
app.use('/api/compensation', require('./routes/compensation.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/companies', require('./routes/company.routes'));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Portfolix Compass Backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
