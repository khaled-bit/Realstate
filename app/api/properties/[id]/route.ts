import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id, workspaceId },
    include: {
      leads: {
        include: {
          lead: { select: { id: true, name: true, country: true, status: true, phone: true } },
        },
      },
    },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(property);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const data = await req.json();

  const existing = await prisma.property.findUnique({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.titleAr !== undefined && { titleAr: data.titleAr }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.price !== undefined && { price: parseFloat(data.price) }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.area !== undefined && { area: data.area ? parseFloat(data.area) : null }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.compound !== undefined && { compound: data.compound }),
      ...(data.developer !== undefined && { developer: data.developer }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.lat !== undefined && { lat: data.lat }),
      ...(data.lng !== undefined && { lng: data.lng }),
    },
    include: {
      leads: {
        include: {
          lead: { select: { id: true, name: true, country: true, status: true, phone: true } },
        },
      },
    },
  });

  return NextResponse.json(property);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const existing = await prisma.property.findUnique({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
