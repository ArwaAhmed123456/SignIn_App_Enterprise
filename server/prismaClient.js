// Ensure env vars are loaded even if required before index.js configures dotenv
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

function getDbUrl() {
  const rawUrl = process.env.DATABASE_URL;
  // Always resolve to an absolute file: URL so the adapter can open it
  if (!rawUrl || rawUrl === 'file:./dev.db') {
    return 'file:' + path.resolve(__dirname, 'dev.db');
  }
  if (rawUrl.startsWith('file:')) {
    const relative = rawUrl.replace(/^file:/, '');
    const abs = path.isAbsolute(relative)
      ? relative
      : path.resolve(__dirname, relative);
    return 'file:' + abs;
  }
  return rawUrl;
}

// PrismaBetterSqlite3 v7+ takes a config object { url } not a Database instance
const adapter = new PrismaBetterSqlite3({ url: getDbUrl() });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
