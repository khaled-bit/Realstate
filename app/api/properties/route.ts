import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { workspaceId };
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
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();
  const property = await prisma.property.create({
    data: {
      workspaceId,
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
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    },
  });
  return NextResponse.json(property, { status: 201 });
}
