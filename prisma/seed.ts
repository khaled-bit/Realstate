import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Seed sample properties
  await prisma.property.createMany({
        data: [
      {
        title: "Luxury 3BR Apartment - New Cairo",
        titleAr: "شقة فاخرة 3 غرف - القاهرة الجديدة",
        type: "Apartment",
        status: "Available",
        price: 180000,
        currency: "USD",
        area: 180,
        bedrooms: 3,
        bathrooms: 2,
        location: "New Cairo",
        compound: "Madinaty",
        developer: "Talaat Moustafa Group",
        description: "Spacious 3-bedroom apartment in Madinaty with lake views. Perfect for Gulf expat families.",
      },
      {
        title: "4BR Villa - Sheikh Zayed",
        titleAr: "فيلا 4 غرف - الشيخ زايد",
        type: "Villa",
        status: "Available",
        price: 350000,
        currency: "USD",
        area: 320,
        bedrooms: 4,
        bathrooms: 3,
        location: "Sheikh Zayed",
        compound: "Beverly Hills",
        developer: "Palm Hills",
        description: "Modern villa with private garden in Beverly Hills compound. Close to schools and malls.",
      },
      {
        title: "2BR Sea View - North Coast",
        titleAr: "شقة 2 غرفة إطلالة بحر - الساحل",
        type: "Chalet",
        status: "Available",
        price: 120000,
        currency: "USD",
        area: 110,
        bedrooms: 2,
        bathrooms: 2,
        location: "North Coast",
        compound: "Hacienda Bay",
        developer: "Palm Hills",
        description: "Stunning sea view chalet in Hacienda Bay. Ideal summer property for Gulf-based Egyptians.",
      },
    ],
  });

  // Seed sample leads
  await prisma.lead.createMany({
        data: [
      {
        name: "Ahmed Al-Rashidi",
        email: "ahmed@example.com",
        phone: "+971501234567",
        whatsapp: "+971501234567",
        country: "UAE",
        city: "Dubai",
        source: "Apollo",
        status: "Qualified",
        budget: 250000,
        budgetCurrency: "USD",
        propertyType: "Villa",
        preferredAreas: "New Cairo,Fifth Settlement",
        notes: "Looking for a villa with garden. Has family of 5. Interested in New Cairo compounds.",
      },
      {
        name: "Omar Hassan",
        email: "omar.hassan@example.com",
        phone: "+966551234567",
        whatsapp: "+966551234567",
        country: "Saudi",
        city: "Riyadh",
        source: "LinkedIn",
        status: "New",
        budget: 150000,
        budgetCurrency: "USD",
        propertyType: "Apartment",
        preferredAreas: "New Cairo,Tagamoa",
        notes: "Engineer working in Riyadh. Wants investment property in Cairo.",
      },
      {
        name: "Khaled Al-Mutairi",
        email: "khaled@example.com",
        phone: "+96590123456",
        country: "Kuwait",
        city: "Kuwait City",
        source: "Apollo",
        status: "Contacted",
        budget: 300000,
        budgetCurrency: "USD",
        propertyType: "Villa",
        preferredAreas: "Sheikh Zayed,October City",
        notes: "Interested in compounds with golf courses. High budget.",
      },
      {
        name: "Amr Fouad",
        email: "amrfouad@example.com",
        phone: "+447891234567",
        country: "EgyptAbroad",
        city: "London",
        source: "Facebook",
        status: "New",
        budget: 90000,
        budgetCurrency: "USD",
        propertyType: "Apartment",
        preferredAreas: "Maadi,Zamalek,New Cairo",
      },
    ],
  });

  // Seed n8n configs
  await prisma.n8nConfig.createMany({
        data: [
      {
        name: "apollo-scrape-gulf",
        webhookUrl: "http://localhost:5678/webhook/apollo-scrape-gulf",
        description: "Scrape Apollo for Egyptian expats in Gulf countries",
        isActive: false,
      },
      {
        name: "linkedin-scrape",
        webhookUrl: "http://localhost:5678/webhook/linkedin-scrape",
        description: "Scrape LinkedIn for high-net-worth Egyptian expats",
        isActive: false,
      },
    ],
  });

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
