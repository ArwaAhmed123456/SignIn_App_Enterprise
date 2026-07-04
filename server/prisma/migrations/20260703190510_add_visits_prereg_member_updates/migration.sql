-- CreateTable
CREATE TABLE "PreRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "expectedDate" DATETIME,
    "siteId" TEXT NOT NULL,
    "visitorGroupId" TEXT,
    "memberId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreRegistration_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreRegistration_visitorGroupId_fkey" FOREIGN KEY ("visitorGroupId") REFERENCES "VisitorGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PreRegistration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Current',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "visitorGroupId" TEXT,
    "password" TEXT,
    "role" TEXT DEFAULT 'guard',
    "permissions" TEXT,
    "siteId" TEXT,
    "mobilePaired" BOOLEAN NOT NULL DEFAULT false,
    "mobileDeviceId" TEXT,
    "mobilePairedAt" DATETIME,
    "mobileTokenHash" TEXT,
    "mobileTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_visitorGroupId_fkey" FOREIGN KEY ("visitorGroupId") REFERENCES "VisitorGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Member_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("createdAt", "email", "firstName", "id", "lastName", "mobileDeviceId", "mobilePaired", "mobilePairedAt", "mobileTokenExpiry", "mobileTokenHash", "password", "permissions", "phone", "role", "siteId", "status", "updatedAt", "visitorGroupId") SELECT "createdAt", "email", "firstName", "id", "lastName", "mobileDeviceId", "mobilePaired", "mobilePairedAt", "mobileTokenExpiry", "mobileTokenHash", "password", "permissions", "phone", "role", "siteId", "status", "updatedAt", "visitorGroupId" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
CREATE TABLE "new_VisitorGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Standard',
    "description" TEXT,
    "accountId" TEXT,
    "siteId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitorGroup_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisitorGroup_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VisitorGroup" ("accountId", "createdAt", "description", "id", "name", "updatedAt") SELECT "accountId", "createdAt", "description", "id", "name", "updatedAt" FROM "VisitorGroup";
DROP TABLE "VisitorGroup";
ALTER TABLE "new_VisitorGroup" RENAME TO "VisitorGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
