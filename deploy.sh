#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Leads Egypt — One-Command Deploy to Vercel + Supabase
# Run this from your LOCAL machine (not Claude Code sandbox)
# Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────────
set -e

APP_NAME="leads-egypt"

# You can set VERCEL_TOKEN as env var before running: export VERCEL_TOKEN=xxx
if [[ -z "$VERCEL_TOKEN" ]]; then
  read -sp "  Paste your Vercel token (vercel.com/account/tokens): " VERCEL_TOKEN
  echo ""
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Leads Egypt — Deploy Script            ║"
echo "║   Vercel + Supabase                      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Check dependencies ──────────────────────────────────
echo "▶ Checking dependencies..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from nodejs.org"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌ npm not found"; exit 1; }
echo "  ✓ Node $(node -v)"

# ── 2. Install CLIs ────────────────────────────────────────
echo ""
echo "▶ Installing Vercel & Supabase CLIs..."
npm install -g vercel supabase 2>/dev/null || npx --yes vercel --version >/dev/null

# ── 3. Create Supabase project ────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Create Supabase Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Open: https://supabase.com/dashboard/new"
echo "  2. Project Name: leads-egypt"
echo "  3. Pick a strong database password (SAVE IT!)"
echo "  4. Choose your region (eu-central-1 recommended)"
echo "  5. Click 'Create new project' and wait ~1 min"
echo ""
echo "  Then go to: Settings → Database → Connection string"
echo "  Copy the 'Transaction' (pooler) URL"
echo ""
read -p "  Paste your DATABASE_URL here: " DATABASE_URL
echo ""

if [[ -z "$DATABASE_URL" ]]; then
  echo "❌ DATABASE_URL cannot be empty"
  exit 1
fi

# Also get direct URL (replace port 6543 → 5432)
DIRECT_URL="${DATABASE_URL/6543/5432}"
# Remove pgbouncer param for direct
DIRECT_URL="${DIRECT_URL/\?pgbouncer=true/}"
DIRECT_URL="${DIRECT_URL/&pgbouncer=true/}"

echo "  ✓ Database URL configured"

# ── 4. Run Prisma migrations ──────────────────────────────
echo ""
echo "▶ Running database migrations..."
npm install
DATABASE_URL="$DATABASE_URL" DIRECT_URL="$DIRECT_URL" npx prisma migrate deploy
echo "  ✓ Migrations applied"

# ── 5. Seed the database ──────────────────────────────────
echo ""
read -p "▶ Seed with sample data (4 leads, 3 properties)? [Y/n] " seed_confirm
if [[ "$seed_confirm" != "n" && "$seed_confirm" != "N" ]]; then
  DATABASE_URL="$DATABASE_URL" npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
  echo "  ✓ Seed complete"
fi

# ── 6. Deploy to Vercel ───────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Deploy to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "▶ Creating Vercel project and deploying..."

# Deploy (first time creates the project)
DEPLOY_OUTPUT=$(npx vercel --token "$VERCEL_TOKEN" --yes --name "$APP_NAME" 2>&1)
echo "$DEPLOY_OUTPUT"

# Get the preview URL
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | tail -1)

if [[ -z "$PREVIEW_URL" ]]; then
  echo ""
  echo "  ⚠ Could not auto-detect URL. Check Vercel dashboard."
  read -p "  Enter your Vercel app URL (e.g. https://leads-egypt.vercel.app): " APP_URL
else
  APP_URL="$PREVIEW_URL"
  echo ""
  echo "  ✓ Deployed to: $APP_URL"
fi

# ── 7. Set environment variables ─────────────────────────
echo ""
echo "▶ Setting environment variables on Vercel..."

set_env() {
  echo "$2" | npx vercel env add "$1" production --token "$VERCEL_TOKEN" --force 2>/dev/null || \
  npx vercel env add "$1" production --token "$VERCEL_TOKEN" <<< "$2" 2>/dev/null || true
}

set_env "DATABASE_URL"            "$DATABASE_URL"
set_env "DIRECT_URL"              "$DIRECT_URL"
set_env "NEXT_PUBLIC_APP_URL"     "$APP_URL"
set_env "N8N_BASE_URL"            "http://localhost:5678"
set_env "NEXT_PUBLIC_APP_NAME"    "Leads Egypt"

echo "  ✓ Environment variables set"

# ── 8. Redeploy with env vars ─────────────────────────────
echo ""
echo "▶ Redeploying with environment variables..."
FINAL_OUTPUT=$(npx vercel --prod --token "$VERCEL_TOKEN" --yes 2>&1)
echo "$FINAL_OUTPUT"

PROD_URL=$(echo "$FINAL_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | tail -1)
[[ -z "$PROD_URL" ]] && PROD_URL="$APP_URL"

# ── 9. Update APP_URL in Vercel ────────────────────────────
echo "$PROD_URL" | npx vercel env add "NEXT_PUBLIC_APP_URL" production --token "$VERCEL_TOKEN" --force 2>/dev/null || true

# ── Done ──────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  DEPLOYMENT COMPLETE!                            ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                       ║"
echo "  🌐  Live URL:    $PROD_URL"
echo ""
echo "  📋  Next steps:"
echo "  1. Open $PROD_URL — your CRM is live!"
echo "  2. Go to n8n Workflows tab → add your n8n webhook URLs"
echo "  3. For WhatsApp: add 'whatsapp-welcome' + 'whatsapp-send' webhooks"
echo "  4. Set NEXT_PUBLIC_APP_URL in Vercel to: $PROD_URL"
echo "     so auto-welcome messages fire correctly"
echo ""
echo "╚══════════════════════════════════════════════════════╝"
