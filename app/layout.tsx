import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Leads Egypt - Real Estate CRM",
  description: "Real estate lead management for Egyptian properties targeting Gulf clients",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex">
        <SessionProvider session={session}>
          <Sidebar />
          <main className="flex-1 md:ml-60 min-h-screen bg-slate-50 pt-14 md:pt-0">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
