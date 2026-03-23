-- Leads Egypt — Supabase Setup SQL
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    "budget" DOUBLE PRECISION,
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "propertyType" TEXT,
    "preferredAreas" TEXT,
    "notes" TEXT,
    "lastContact" TIMESTAMPTZ,
    "n8nWorkflowId" TEXT,
    "apolloId" TEXT,
    "externalId" TEXT
);

CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "by" TEXT NOT NULL DEFAULT 'System',
    CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "area" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "location" TEXT NOT NULL,
    "compound" TEXT,
    "developer" TEXT,
    "imageUrl" TEXT,
    "features" TEXT
);

CREATE TABLE IF NOT EXISTS "LeadProperty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "interest" TEXT NOT NULL DEFAULT 'Interested',
    CONSTRAINT "LeadProperty_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "N8nConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "targetCountries" TEXT NOT NULL,
    "n8nWorkflowId" TEXT,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeadProperty_leadId_propertyId_key" ON "LeadProperty"("leadId", "propertyId");
CREATE UNIQUE INDEX IF NOT EXISTS "N8nConfig_name_key" ON "N8nConfig"("name");

-- Also create the Prisma migrations tracking table so prisma doesn't re-run
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
