import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
            <Suspense>
              {children}
            </Suspense>
          </div>
        </main>
        {/* Mobile bottom navigation - visible only on mobile */}
        <MobileNav />
      </div>
    </div>
  );
}
