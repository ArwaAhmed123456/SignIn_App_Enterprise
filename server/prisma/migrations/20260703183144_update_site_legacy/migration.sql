/*
  Warnings:

  - Added the required column `code` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "password" TEXT,
    "adminEmail" TEXT,
    "address" TEXT,
    "accountId" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("accountId", "address", "createdAt", "id", "name", "updatedAt") SELECT "accountId", "address", "createdAt", "id", "name", "updatedAt" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
