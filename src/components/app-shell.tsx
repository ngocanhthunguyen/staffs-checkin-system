"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  LayoutDashboard,
  FileText,
  AlertCircle,
  LogOut,
  Users,
  CalendarDays,
} from "lucide-react";
import { signOut } from "@/app/actions/attendance";
import { COMPANY_NAME, splitBi, th } from "@/lib/i18n";
import type { Profile } from "@/types/database";

const staffNav = [
  { href: "/", label: th.checkIn, icon: Clock },
  { href: "/leave", label: th.leave, icon: CalendarDays },
];

const managerNav = [
  { href: "/", label: th.checkIn, icon: Clock },
  { href: "/dashboard", label: th.dashboard, icon: LayoutDashboard },
  { href: "/reports", label: th.reports, icon: FileText },
  { href: "/team", label: th.team, icon: Users },
  { href: "/leave", label: th.leave, icon: CalendarDays },
  { href: "/corrections", label: th.corrections, icon: AlertCircle },
];

// Admins oversee the system but don't clock in/out themselves, so there's
// no Check In tab and "/" isn't in their nav (it redirects to /dashboard).
const adminNav = managerNav.filter((item) => item.href !== "/");

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav =
    profile.role === "admin" ? adminNav : profile.role === "manager" ? managerNav : staffNav;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {COMPANY_NAME}
            </p>
            <p className="text-sm font-semibold text-slate-900">{profile.full_name}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{th.signOut}</span>
            </button>
          </form>
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-lg flex-1 px-4 py-6 ${nav.length > 0 ? "safe-bottom" : "pb-6"}`}
      >
        {children}
      </main>

      {nav.length > 0 && (
        <nav className="sticky bottom-0 border-t border-slate-200 bg-white safe-bottom">
          <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              const { th: thLabel, en: enLabel } = splitBi(label);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-center transition-colors ${
                    active
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-blue-600" : ""}`} />
                  <span className="text-[10px] font-medium leading-tight">{thLabel}</span>
                  {enLabel && (
                    <span className="text-[9px] leading-tight opacity-70">{enLabel}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
