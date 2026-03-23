import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Leads Egypt - Real Estate CRM",
  description: "Real estate lead management for Egyptian properties targeting Gulf clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex">
        <Sidebar />
        <main className="flex-1 md:ml-60 min-h-screen bg-slate-50 pt-14 md:pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}
