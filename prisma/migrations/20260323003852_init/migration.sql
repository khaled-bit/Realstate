-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Egyptian',
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "campaign" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "budget" REAL,
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "propertyType" TEXT,
    "preferredAreas" TEXT,
    "notes" TEXT,
    "lastContact" DATETIME,
    "n8nWorkflowId" TEXT,
    "apolloId" TEXT,
    "externalId" TEXT
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "by" TEXT NOT NULL DEFAULT 'System',
    CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "area" REAL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "location" TEXT NOT NULL,
    "compound" TEXT,
    "developer" TEXT,
    "imageUrl" TEXT,
    "features" TEXT
);

-- CreateTable
CREATE TABLE "LeadProperty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "interest" TEXT NOT NULL DEFAULT 'Interested',
    CONSTRAINT "LeadProperty_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "N8nConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "targetCountries" TEXT NOT NULL,
    "n8nWorkflowId" TEXT,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadProperty_leadId_propertyId_key" ON "LeadProperty"("leadId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "N8nConfig_name_key" ON "N8nConfig"("name");
