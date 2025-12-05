employeeCount: 75/**
 * Seed Database Script - PHASE 2
 * Creates test data for Portfolix Enterprise
 * Usage: npm run seed
 *
 * Creates:
 * - Parent Organization: Portfolix enterprise Private limited
 * - Test users with hashed passwords
 * - Test employees
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolix-compass';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (ONLY for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Clearing existing data...');
      await Organization.deleteMany({});
      await User.deleteMany({});
      await Employee.deleteMany({});
    }

    // Create Parent Organization: Portfolix enterprise Private limited
    console.log('Creating parent organization: Portfolix enterprise Private limited...');
    const parentOrg = await Organization.create({
      name: 'Portfolix enterprise Private limited',
      orgCode: 'PORTX001',
      email: 'info@portfolix.tech',
      phone: '+91-7994721792',
      industry: 'Consulting',
      foundedYear: 2024,
      employeeCount: 9,
      address: {
        street: 'Ground Floor, KUBZ, 2115, Padamugal - Palachuvadu Rd, Satellite Twp',
        city: 'Kakkanad',
        state: 'Kerala',
        country: 'India',
        zipCode: '682037',
      },
      registrationNumber: 'U85499KL2024PTC089421',
      panNumber: 'AAPCP0269E',
      gstNumber: '32AAPCP0269E1ZI',
      tandNumber: 'TVDP03676B',
      pfRegistration: 'KL/PF/12345',
      taxConfigurations: {
        incomeTaxSlabYear: 2024,
        professionalTaxState: 'Kerala',
        pfContributionRate: 12,
        esicContributionRate: 3.25,
      },
      subscriptionPlan: 'Enterprise',
      subscriptionStatus: 'Active',
      subscriptionStartDate: new Date('2024-01-01'),
      subscriptionEndDate: new Date('2025-12-31'),
      status: 'Active',
      isVerified: true,
      settings: {
        allowSalaryAdvance: true,
        allowLeaveEncashment: true,
        defaultPaymentCycle: 'Monthly',
        bankAccountForSalary: {
          bankName: 'Federal Bank',
          accountNumber: '16080200009102',
          ifscCode: 'FDRL0001608',
          accountHolderName: 'Portfolix enterprise Private limited',
        },
      },
    });
    console.log('✓ Parent Organization created:', parentOrg._id);
    console.log('  - Organization Code: PORTX001');
    console.log('  - Email: info@portfolix.tech');
    console.log('  - Phone: +91-7994721792');
    console.log('  - Address: Ground Floor, KUBZ, 2115, Padamugal - Palachuvadu Rd, Satellite Twp, Kakkanad, Kerala 682037');
    console.log('  - Bank: Federal Bank');
    console.log('  - CIN: U85499KL2024PTC089421');
    console.log('  - PAN: AAPCP0269E');
    console.log('  - GSTIN: 32AAPCP0269E1ZI');
    console.log('  - TAN: TVDP03676B');

    // Create Portfolio Builders sub-organization reference
    console.log('\nCreating Portfolio Builders reference (runs under parent)...');
    const portBuilder = await Organization.create({
      name: 'Portfolio Builders',
      orgCode: 'PORTX002',
      email: 'info@portfoliobuilders.in',
      phone: '+91-7994721792',
      industry: 'Education',
      foundedYear: 2021,
      employeeCount: 9,
      address: {
        street: 'Ground Floor, KUBZ, 2115, Padamugal - Palachuvadu Rd, Satellite Twp',
        city: 'Kakkanad',
        state: 'Kerala',
        country: 'India',
        zipCode: '682037',
      },
      registrationNumber: 'U85499KL2024PTC089421',
      panNumber: 'AAPCP0269E',
      gstNumber: '32AAPCP0269E1ZI',
      tandNumber: 'TVDP03676B',
      pfRegistration: 'KL/PF/12345',
      taxConfigurations: {
        incomeTaxSlabYear: 2024,
        professionalTaxState: 'Kerala',
        pfContributionRate: 12,
        esicContributionRate: 3.25,
      },
      subscriptionPlan: 'Professional',
      subscriptionStatus: 'Active',
      subscriptionStartDate: new Date('2024-01-01'),
      subscriptionEndDate: new Date('2025-12-31'),
      status: 'Active',
      isVerified: true,
      settings: {
        allowSalaryAdvance: true,
        allowLeaveEncashment: true,
        defaultPaymentCycle: 'Monthly',
        bankAccountForSalary: {
          bankName: 'Federal Bank',
          accountNumber: '16080200009102',
          ifscCode: 'FDRL0001608',
          accountHolderName: 'Portfolix enterprise Private limited',
        },
      },
    });
    console.log('✓ Portfolio Builders created (PORTX002)');
    console.log('  - Email: info@portfoliobuilders.in');
    console.log('  - Uses parent organization banking and tax details');

    console.log('\n=== ORGANIZATIONS CREATED SUCCESSFULLY ===');
    console.log('\nParent Organization: Portfolix enterprise Private limited');
    console.log('├─ Code: PORTX001');
    console.log('├─ Email: info@portfolix.tech');
    console.log('├─ Phone: +91-7994721792');
    console.log('├─ Location: Kakkanad, Kerala');
    console.log('├─ Bank: Federal Bank');
    console.log('└─ CIN: U85499KL2024PTC089421');
    console.log('\nSub-Division: Portfolio Builders');
    console.log('├─ Code: PORTX002');
    console.log('├─ Email: info@portfoliobuilders.in');
    console.log('└─ Runs under parent organization');
    console.log('\n=== ALL ORGANIZATION DATA SEEDED ===\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
