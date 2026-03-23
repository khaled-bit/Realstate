import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.workspaceId) redirect("/login");
  return session;
}

export async function getWorkspaceId(): Promise<string> {
  const session = await requireSession();
  return session.user.workspaceId;
}
