import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";

// Pin the entire dashboard layout to dynamic Node-runtime rendering.
// Children pages (dashboard, clips, videos, …) all read per-user data
// from Prisma; allowing the layout to be prerendered or run on Edge
// would cascade into the same kinds of failures we already fixed at
// the page level.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

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
