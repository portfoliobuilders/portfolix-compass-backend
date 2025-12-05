/**
 * Seed Database Script - PHASE 2
 * Creates test data for Portfolix Enterprise
 * Usage: npm run seed
 *
 * Creates:
 * - Parent Organization: Portfolix enterprise Private limited
 * - Sub-Organizations: Portfolio Builders & Portfolix.Tech
 * - Test users with hashed passwords
 * - Test employees
 * - Test permissions
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
    console.log('Creating parent organization...');
    const parentOrg = await Organization.create({
      name: 'Portfolix enterprise Private limited',
      orgCode: 'PORTX001',
      email: 'info@portfolixenterprise.com',
      phone: '+91-9876543210',
      industry: 'Consulting',
      foundedYear: 2020,
      employeeCount: 150,
      address: {
        street: 'Plot 123, Tech Park Building A',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560001',
      },
      registrationNumber: 'CIN123456789',
      panNumber: 'AAAPA0001K',
      gstNumber: '18AABCP1234A1Z5',
      tandNumber: 'TAN001234',
      pfRegistration: 'KA/PF/12345',
      taxConfigurations: {
        incomeTaxSlabYear: 2024,
        professionalTaxState: 'Karnataka',
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
          bankName: 'HDFC Bank',
          accountNumber: '1234567890123',
          ifscCode: 'HDFC0000123',
          accountHolderName: 'Portfolix enterprise Private limited',
        },
      },
    });
    console.log('Parent Organization created:', parentOrg._id);

    // Create Sub-Organization 1: Portfolio Builders (edtech)
    console.log('Creating Portfolio Builders (edtech)...');
    const portBuilder = await Organization.create({
      name: 'Portfolio Builders',
      orgCode: 'PORTX002',
      email: 'info@portfoliobuilders.in',
      phone: '+91-8765432109',
      industry: 'Education',
      foundedYear: 2021,
      employeeCount: 75,
      address: {
        street: 'Suite 201, Innovation Hub',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560002',
      },
      registrationNumber: 'CIN987654321',
      panNumber: 'AAAPB0002K',
      gstNumber: '18AABCB1234B1Z5',
      tandNumber: 'TAN001235',
      pfRegistration: 'KA/PF/12346',
      taxConfigurations: {
        incomeTaxSlabYear: 2024,
        professionalTaxState: 'Karnataka',
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
          bankName: 'ICICI Bank',
          accountNumber: '1122334455667',
          ifscCode: 'ICIC0000456',
          accountHolderName: 'Portfolio Builders',
        },
      },
    });
    console.log('Portfolio Builders created:', portBuilder._id);

    // Create Sub-Organization 2: Portfolix.Tech (Software Development)
    console.log('Creating Portfolix.Tech (Software Development)...');
    const portTech = await Organization.create({
      name: 'Portfolix.Tech',
      orgCode: 'PORTX003',
      email: 'info@portfolix.tech',
      phone: '+91-7654321098',
      industry: 'IT',
      foundedYear: 2022,
      employeeCount: 60,
      address: {
        street: 'Floor 5, Silicon Valley Plaza',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560003',
      },
      registrationNumber: 'CIN456123789',
      panNumber: 'AAAPV0003K',
      gstNumber: '18AABCV1234V1Z5',
      tandNumber: 'TAN001236',
      pfRegistration: 'KA/PF/12347',
      taxConfigurations: {
        incomeTaxSlabYear: 2024,
        professionalTaxState: 'Karnataka',
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
          bankName: 'Axis Bank',
          accountNumber: '9876543210123',
          ifscCode: 'AXIS0000789',
          accountHolderName: 'Portfolix.Tech',
        },
      },
    });
    console.log('Portfolix.Tech created:', portTech._id);

    console.log('\n=== ORGANIZATIONS CREATED SUCCESSFULLY ===\n');
    console.log('Parent Organization:', parentOrg.name);
    console.log(' - Code:', parentOrg.orgCode);
    console.log(' - Email:', parentOrg.email);
    console.log('\nSub-Organization 1: Portfolio Builders');
    console.log(' - Code:', portBuilder.orgCode);
    console.log(' - Email:', portBuilder.email);
    console.log('\nSub-Organization 2: Portfolix.Tech');
    console.log(' - Code:', portTech.orgCode);
    console.log(' - Email:', portTech.email);
    console.log('\n=== ALL ORGANIZATION DATA SEEDED ===\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
