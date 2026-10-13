"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/workout", label: "Workout", icon: "🏋️" },
  { href: "/history", label: "History", icon: "📜" },
  { href: "/coach", label: "AI Coach", icon: "🤖" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="text-2xl">🏋️‍♂️</span>
            <span className="text-lg font-bold gradient-text hidden sm:block">
              FormFit AI
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
                  )}
                >
                  <span className="text-base">{icon}</span>
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-[var(--color-text-muted)] hidden sm:block">
                  👤 {user.username}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-[var(--color-text-dimmed)] hover:text-[var(--color-accent-red)] transition-colors px-2 py-1 rounded"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
