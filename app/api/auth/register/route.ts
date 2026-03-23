import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

export async function POST(req: Request) {
  const { name, workspaceName, email, password } = await req.json();
  if (!name || !workspaceName || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const workspace = await prisma.workspace.create({
    data: {
      name: workspaceName,
      slug: toSlug(workspaceName),
      plan: "trial",
      trialEndsAt,
      users: {
        create: {
          name,
          email,
          password: hashed,
          role: "Owner",
        },
      },
    },
  });

  return NextResponse.json({ workspaceId: workspace.id });
}
