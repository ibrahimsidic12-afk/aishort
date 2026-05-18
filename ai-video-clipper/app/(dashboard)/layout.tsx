import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
            <Suspense>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
