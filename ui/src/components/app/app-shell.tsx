"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  title: string;
  subtitle?: string;
  gymId?: number;
  headerExtras?: ReactNode;
  children: ReactNode;
};

function NavPill({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#ff5e62]"
          : "rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
      }
    >
      {label}
    </Link>
  );
}

export function AppShell({ title, subtitle, gymId, headerExtras, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/25" />
            <div>
              <p className="text-sm font-semibold text-white/90">MasterGym</p>
              <h1 className="text-2xl font-black leading-7 sm:text-3xl">
                {title}
                {typeof gymId === "number" ? ` (Gym #${gymId})` : ""}
              </h1>
              {subtitle && <p className="text-white/80">{subtitle}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NavPill href="/dashboard" label="Dashboard" />
            <NavPill href="/clients" label="Clientes" />
            <NavPill href="/payments" label="Pagos" />
            {headerExtras}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}
