# Leads Egypt — Real Estate CRM

A full-stack real estate lead management web app for **Egyptian properties** targeting **Gulf clients** (UAE, Saudi, Kuwait, Qatar, Bahrain) and **Egyptians abroad**.

## Features

- **Lead Management** — Full pipeline (New → Contacted → Qualified → Proposal → Deal)
- **n8n Integration** — Trigger workflows, receive leads via webhook
- **Apollo.io** — Enrich leads via n8n Apollo workflows
- **Web Scraping** — Trigger n8n scraping campaigns
- **Properties Catalog** — List Egyptian properties and match to leads
- **Campaigns** — Create targeted outreach campaigns by country
- **Activity Log** — Track calls, emails, WhatsApp messages per lead

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** v4
- **Prisma 7** + SQLite (via libsql)
- **n8n** webhook integration

## Getting Started

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Seed sample data (4 leads, 3 properties, 2 n8n configs)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## n8n Integration

### Receive leads INTO this CRM from n8n:
In your n8n workflow, add an **HTTP Request** node at the end:
```
POST http://YOUR_APP_URL/api/webhooks/leads
Content-Type: application/json

{
  "name": "Mohamed Ahmed",
  "email": "client@email.com",
  "phone": "+971501234567",
  "country": "UAE",
  "source": "Apollo",
  "apolloId": "apollo_id_here",
  "budget": 200000,
  "notes": "Software Engineer at Company"
}
```
Accepts **single lead** or **array of leads**. Auto-deduplicates by email/apolloId.

### Trigger n8n workflows FROM this CRM:
1. Go to **n8n Workflows** tab in the app
2. Add your n8n webhook URL (Settings > n8n Connection)
3. Click **Trigger** to run on demand

## Apollo.io Field Mapping (in n8n)

```
name     → person.name
email    → person.email
phone    → person.phone_numbers[0].sanitized_number
country  → map present_raw_address → UAE/Saudi/Kuwait/Qatar/EgyptAbroad
source   → "Apollo"
apolloId → person.id
notes    → person.title + " at " + person.organization_name
```

## Target Markets

| Market | Flag |
|--------|------|
| UAE | 🇦🇪 |
| Saudi Arabia | 🇸🇦 |
| Kuwait | 🇰🇼 |
| Qatar | 🇶🇦 |
| Bahrain | 🇧🇭 |
| Egyptians Abroad (UK/USA/Europe) | 🇪🇬 |
