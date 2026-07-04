-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT,
    "siteId" TEXT NOT NULL,
    "name" TEXT,
    "trade" TEXT,
    "carReg" TEXT,
    "userType" TEXT,
    "timeIn" TEXT,
    "timeOut" TEXT,
    "hours" REAL,
    "date" TEXT,
    "reason" TEXT,
    "imageUrl" TEXT,
    "checkIn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOut" DATETIME,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("checkIn", "checkOut", "createdAt", "duration", "id", "memberId", "siteId", "updatedAt") SELECT "checkIn", "checkOut", "createdAt", "duration", "id", "memberId", "siteId", "updatedAt" FROM "ActivityLog";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
