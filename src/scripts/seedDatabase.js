/**
 * Seed Database Script - PHASE 2
 * Creates test data for authentication testing
 * Usage: npm run seed
 * 
 * Creates:
 * - Test companies
 * - Test users with hashed passwords
 * - Test employees
 * - Test permissions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
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
      await Company.deleteMany({});
      await User.deleteMany({});
      await Employee.deleteMany({});
    }

    // Create test companies
    console.log('Creating test companies...');
    const company1 = await Company.create({
      name: 'Portfolio Builders Inc',
      shortName: 'PBI',
      industry: 'Technology',
      registrationNumber: 'REG001',
      address: '123 Tech Street, San Francisco, CA',
      phone: '+1-555-0001',
      email: 'info@portfoliobuilders.com',
      fiscalYearStart: '01-04',
      country: 'USA',
      state: 'California',
      pincode: '94101'
    });

    const company2 = await Company.create({
      name: 'Portfolix Media Solutions',
      shortName: 'PMS',
      industry: 'Media & Entertainment',
      registrationNumber: 'REG002',
      address: '456 Media Avenue, New York, NY',
      phone: '+1-555-0002',
      email: 'info@portfolixmedia.com',
      fiscalYearStart: '01-04',
      country: 'USA',
      state: 'New York',
      pincode: '10001'
    });

    console.log('Companies created:', company1._id, company2._id);

    // Create test users
    console.log('Creating test users...');
    const user1 = await User.create({
      email: 'admin@portfoliobuilders.com',
      password: 'Admin@123456', // Will be hashed by pre-save hook
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      permissions: ['CREATE_EMPLOYEE', 'VIEW_PAYROLL', 'APPROVE_LEAVE', 'VIEW_REPORTS'],
      companyId: company1._id,
      isActive: true
    });

    const user2 = await User.create({
      email: 'hr@portfoliobuilders.com',
      password: 'HR@123456', // Will be hashed by pre-save hook
      firstName: 'HR',
      lastName: 'Manager',
      role: 'HR_MANAGER',
      permissions: ['CREATE_EMPLOYEE', 'APPROVE_LEAVE', 'VIEW_EMPLOYEES'],
      companyId: company1._id,
      isActive: true
    });

    const user3 = await User.create({
      email: 'payroll@portfoliobuilders.com',
      password: 'Payroll@123456', // Will be hashed by pre-save hook
      firstName: 'Payroll',
      lastName: 'Admin',
      role: 'PAYROLL_ADMIN',
      permissions: ['VIEW_PAYROLL', 'GENERATE_SALARY_SLIP', 'VIEW_REPORTS'],
      companyId: company1._id,
      isActive: true
    });

    const user4 = await User.create({
      email: 'employee@portfoliobuilders.com',
      password: 'Employee@123456', // Will be hashed by pre-save hook
      firstName: 'John',
      lastName: 'Employee',
      role: 'USER',
      permissions: ['VIEW_PROFILE', 'APPLY_LEAVE'],
      companyId: company1._id,
      isActive: true
    });

    // Create test user for second company
    const user5 = await User.create({
      email: 'admin@portfolixmedia.com',
      password: 'AdminMedia@123456', // Will be hashed by pre-save hook
      firstName: 'Admin',
      lastName: 'Media',
      role: 'SUPER_ADMIN',
      permissions: ['CREATE_EMPLOYEE', 'VIEW_PAYROLL', 'APPROVE_LEAVE'],
      companyId: company2._id,
      isActive: true
    });

    console.log('Users created:');
    console.log('- Admin:', user1.email);
    console.log('- HR Manager:', user2.email);
    console.log('- Payroll Admin:', user3.email);
    console.log('- Employee:', user4.email);
    console.log('- Media Admin:', user5.email);

    // Create test employees
    console.log('Creating test employees...');
    const employee1 = await Employee.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@portfoliobuilders.com',
      phone: '555-0101',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'Male',
      address: '100 Main St',
      city: 'San Francisco',
      state: 'CA',
      pincode: '94101',
      companyId: company1._id,
      department: 'Engineering',
      designation: 'Senior Developer',
      reportingTo: 'manager@company.com',
      dateOfJoining: new Date('2021-06-01'),
      employmentType: 'Full Time',
      status: 'Active'
    });

    const employee2 = await Employee.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@portfoliobuilders.com',
      phone: '555-0102',
      dateOfBirth: new Date('1992-03-22'),
      gender: 'Female',
      address: '200 Park Ave',
      city: 'San Francisco',
      state: 'CA',
      pincode: '94101',
      companyId: company1._id,
      department: 'Human Resources',
      designation: 'HR Manager',
      reportingTo: 'admin@company.com',
      dateOfJoining: new Date('2020-11-15'),
      employmentType: 'Full Time',
      status: 'Active'
    });

    console.log('Employees created:');
    console.log('- Employee 1:', employee1.email);
    console.log('- Employee 2:', employee2.email);

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===\n');
    console.log('Test credentials:');
    console.log('Company 1: Portfolio Builders Inc');
    console.log('  - Admin: admin@portfoliobuilders.com / Admin@123456');
    console.log('  - HR Manager: hr@portfoliobuilders.com / HR@123456');
    console.log('  - Payroll: payroll@portfoliobuilders.com / Payroll@123456');
    console.log('  - Employee: employee@portfoliobuilders.com / Employee@123456');
    console.log('\nCompany 2: Portfolix Media Solutions');
    console.log('  - Admin: admin@portfolixmedia.com / AdminMedia@123456');
    console.log('\n=== Ready for testing authentication endpoints ===\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
