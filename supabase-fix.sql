-- Run this in Supabase SQL Editor to fix missing tables/columns

-- Add missing columns to Lead table
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappSentAt" TIMESTAMPTZ;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastWhatsapp" TEXT;

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "leadId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'Outbound',
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Sent',
    "n8nMsgId" TEXT,
    CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create MessageTemplate table
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_name_key" ON "MessageTemplate"("name");
