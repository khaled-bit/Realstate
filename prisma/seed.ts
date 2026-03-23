import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  // Create demo workspace + owner
  const existing = await prisma.workspace.findFirst({ where: { slug: "demo-workspace" } });
  const workspace = existing ?? await prisma.workspace.create({
    data: {
      name: "Demo Brokerage",
      slug: "demo-workspace",
      plan: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 86400000),
      users: {
        create: {
          name: "Demo Owner",
          email: "demo@leadsegypt.com",
          password: await bcrypt.hash("demo1234", 12),
          role: "Owner",
        },
      },
    },
  });

  const wsId = workspace.id;

  // Message templates
  for (const tpl of [
    { name: "welcome-ar", channel: "WhatsApp", language: "ar", body: "مرحباً {{name}}،\nأهلاً بك! نشكرك على اهتمامك بعقاراتنا في مصر 🏡\nهل يمكنني مساعدتك في العثور على وحدتك المثالية؟" },
    { name: "welcome-en", channel: "WhatsApp", language: "en", body: "Hello {{name}},\n\nThank you for your interest in Egyptian real estate! 🏡\n\nWe specialize in premium properties for Gulf-based Egyptians and expats.\n\nWhat type of property are you looking for?" },
    { name: "follow-up", channel: "WhatsApp", language: "both", body: "مرحباً {{name}}،\nأردت التواصل معك لمعرفة إذا كان لديك أي أسئلة.\n\nHello {{name}}, just following up to see if you have any questions. I'm here to help! 🏠" },
  ]) {
    const exists = await prisma.messageTemplate.findUnique({ where: { workspaceId_name: { workspaceId: wsId, name: tpl.name } } });
    if (!exists) await prisma.messageTemplate.create({ data: { ...tpl, workspaceId: wsId } });
  }

  // n8n configs
  for (const cfg of [
    { name: "whatsapp-welcome", description: "Auto-send welcome WhatsApp on new lead", webhookUrl: "http://localhost:5678/webhook/whatsapp-welcome", isActive: false },
    { name: "whatsapp-send", description: "Manual WhatsApp send from lead page", webhookUrl: "http://localhost:5678/webhook/whatsapp-send", isActive: false },
  ]) {
    const exists = await prisma.n8nConfig.findUnique({ where: { workspaceId_name: { workspaceId: wsId, name: cfg.name } } });
    if (!exists) await prisma.n8nConfig.create({ data: { ...cfg, workspaceId: wsId } });
  }

  // Properties
  for (const p of [
    { title: "Luxury 3BR Apartment - New Cairo", titleAr: "شقة فاخرة 3 غرف - القاهرة الجديدة", type: "Apartment", status: "Available", price: 180000, currency: "USD", area: 180, bedrooms: 3, bathrooms: 2, location: "New Cairo", compound: "Madinaty", developer: "Talaat Moustafa Group" },
    { title: "4BR Villa - Sheikh Zayed", titleAr: "فيلا 4 غرف - الشيخ زايد", type: "Villa", status: "Available", price: 350000, currency: "USD", area: 320, bedrooms: 4, bathrooms: 3, location: "Sheikh Zayed", compound: "Beverly Hills", developer: "Palm Hills" },
    { title: "2BR Sea View Chalet - North Coast", titleAr: "شاليه 2 غرفة إطلالة بحر", type: "Chalet", status: "Available", price: 120000, currency: "USD", area: 110, bedrooms: 2, bathrooms: 2, location: "North Coast", compound: "Hacienda Bay", developer: "Palm Hills" },
  ]) {
    await prisma.property.create({ data: { ...p, workspaceId: wsId } });
  }

  // Sample leads
  for (const l of [
    { name: "Ahmed Al-Rashidi", email: "ahmed@example.com", phone: "+971501234567", whatsapp: "+971501234567", country: "UAE", city: "Dubai", source: "Apollo", status: "Qualified", budget: 250000, budgetCurrency: "USD", propertyType: "Villa", preferredAreas: "New Cairo,Fifth Settlement", notes: "Looking for a villa with garden. Has family of 5." },
    { name: "Omar Hassan", email: "omar.hassan@example.com", phone: "+966551234567", country: "Saudi", city: "Riyadh", source: "LinkedIn", status: "New", budget: 150000, budgetCurrency: "USD", propertyType: "Apartment" },
    { name: "Khaled Al-Mutairi", email: "khaled@example.com", phone: "+96590123456", country: "Kuwait", city: "Kuwait City", source: "Apollo", status: "Contacted", budget: 300000, budgetCurrency: "USD", propertyType: "Villa" },
  ]) {
    await prisma.lead.create({ data: { ...l, workspaceId: wsId } });
  }

  console.log("✅ Seed complete! Demo login: demo@leadsegypt.com / demo1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());
