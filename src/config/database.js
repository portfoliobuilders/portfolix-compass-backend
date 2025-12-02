/**
 * Database Configuration
 * Initializes Prisma ORM client with connection pooling and logging configuration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

/**
 * Connect to database on startup
 */
prisma.$connect()
  .then(() => {
    console.log('✓ Database connected successfully');
  })
  .catch((err) => {
    console.error('✗ Failed to connect to database:', err.message);
    process.exit(1);
  });

/**
 * Handle graceful disconnection on process termination
 */
process.on('SIGINT', async () => {
  console.log('\n✓ Closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
