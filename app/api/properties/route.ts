import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const properties = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  return NextResponse.json(properties);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const property = await prisma.property.create({
    data: {
      title: data.title,
      titleAr: data.titleAr,
      description: data.description,
      type: data.type,
      status: data.status || "Available",
      price: parseFloat(data.price),
      currency: data.currency || "USD",
      area: data.area ? parseFloat(data.area) : null,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
      location: data.location,
      compound: data.compound,
      developer: data.developer,
      imageUrl: data.imageUrl,
      features: data.features ? JSON.stringify(data.features) : null,
    },
  });
  return NextResponse.json(property, { status: 201 });
}
