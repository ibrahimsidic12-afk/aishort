"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/uploads", label: "Upload", icon: "⬆️" },
  { href: "/videos", label: "Videos", icon: "🎬" },
  { href: "/clips", label: "Clips", icon: "✂️" },
  { href: "/review", label: "Review", icon: "👁️" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          AI Clipper
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              pathname === item.href
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
