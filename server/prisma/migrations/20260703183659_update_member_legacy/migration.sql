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
    CONSTRAINT "Member_visitorGroupId_fkey" FOREIGN KEY ("visitorGroupId") REFERENCES "VisitorGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Member_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("createdAt", "email", "firstName", "id", "lastName", "phone", "status", "updatedAt", "visitorGroupId") SELECT "createdAt", "email", "firstName", "id", "lastName", "phone", "status", "updatedAt", "visitorGroupId" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
