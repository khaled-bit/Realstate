import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed message templates
  await prisma.messageTemplate.upsert({
    where: { name: "welcome" },
    update: {},
    create: {
      name: "welcome",
      channel: "WhatsApp",
      language: "both",
      body: `مرحباً {{name}}،
أهلاً بك! نشكرك على اهتمامك بعقاراتنا في مصر 🏡

نحن متخصصون في توفير أفضل الوحدات السكنية للمغتربين المصريين وعملاء الخليج.

Hello {{name}},
Thank you for your interest in Egyptian real estate 🏡
We specialize in premium properties for Gulf clients & Egyptian expats.

May I help you find your perfect property?`,
    },
  });

  // Seed n8n configs
  for (const cfg of [
    { name: "whatsapp-welcome", description: "Auto-send welcome WhatsApp on new lead", webhookUrl: "http://localhost:5678/webhook/whatsapp-welcome", isActive: false },
    { name: "whatsapp-send", description: "Manual WhatsApp send from lead page", webhookUrl: "http://localhost:5678/webhook/whatsapp-send", isActive: false },
    { name: "apollo-scrape-gulf", description: "Scrape Apollo for Egyptian expats in Gulf", webhookUrl: "http://localhost:5678/webhook/apollo-scrape-gulf", isActive: false },
    { name: "linkedin-scrape", description: "Scrape LinkedIn for high-net-worth Egyptian expats", webhookUrl: "http://localhost:5678/webhook/linkedin-scrape", isActive: false },
  ]) {
    await prisma.n8nConfig.upsert({ where: { name: cfg.name }, update: {}, create: cfg });
  }

  // Seed sample properties
  for (const p of [
    {
      title: "Luxury 3BR Apartment - New Cairo",
      titleAr: "شقة فاخرة 3 غرف - القاهرة الجديدة",
      type: "Apartment", status: "Available", price: 180000, currency: "USD",
      area: 180, bedrooms: 3, bathrooms: 2, location: "New Cairo",
      compound: "Madinaty", developer: "Talaat Moustafa Group",
      description: "Spacious 3-bedroom apartment in Madinaty with lake views.",
    },
    {
      title: "4BR Villa - Sheikh Zayed",
      titleAr: "فيلا 4 غرف - الشيخ زايد",
      type: "Villa", status: "Available", price: 350000, currency: "USD",
      area: 320, bedrooms: 4, bathrooms: 3, location: "Sheikh Zayed",
      compound: "Beverly Hills", developer: "Palm Hills",
      description: "Modern villa with private garden in Beverly Hills compound.",
    },
    {
      title: "2BR Sea View Chalet - North Coast",
      titleAr: "شاليه 2 غرفة إطلالة بحر - الساحل",
      type: "Chalet", status: "Available", price: 120000, currency: "USD",
      area: 110, bedrooms: 2, bathrooms: 2, location: "North Coast",
      compound: "Hacienda Bay", developer: "Palm Hills",
      description: "Stunning sea view chalet in Hacienda Bay.",
    },
  ]) {
    await prisma.property.create({ data: p });
  }

  // Seed sample leads
  for (const l of [
    {
      name: "Ahmed Al-Rashidi", email: "ahmed@example.com",
      phone: "+971501234567", whatsapp: "+971501234567",
      country: "UAE", city: "Dubai", source: "Apollo", status: "Qualified",
      budget: 250000, budgetCurrency: "USD", propertyType: "Villa",
      preferredAreas: "New Cairo,Fifth Settlement",
      notes: "Looking for a villa with garden. Has family of 5.",
    },
    {
      name: "Omar Hassan", email: "omar.hassan@example.com",
      phone: "+966551234567", whatsapp: "+966551234567",
      country: "Saudi", city: "Riyadh", source: "LinkedIn", status: "New",
      budget: 150000, budgetCurrency: "USD", propertyType: "Apartment",
      preferredAreas: "New Cairo,Tagamoa",
      notes: "Engineer in Riyadh. Wants investment property in Cairo.",
    },
    {
      name: "Khaled Al-Mutairi", email: "khaled@example.com",
      phone: "+96590123456", country: "Kuwait", city: "Kuwait City",
      source: "Apollo", status: "Contacted", budget: 300000, budgetCurrency: "USD",
      propertyType: "Villa", preferredAreas: "Sheikh Zayed,October City",
      notes: "Interested in compounds with golf courses.",
    },
    {
      name: "Amr Fouad", email: "amrfouad@example.com",
      phone: "+447891234567", country: "EgyptAbroad", city: "London",
      source: "Facebook", status: "New", budget: 90000, budgetCurrency: "USD",
      propertyType: "Apartment", preferredAreas: "Maadi,Zamalek,New Cairo",
    },
  ]) {
    await prisma.lead.create({ data: l });
  }

  console.log("✅ Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
