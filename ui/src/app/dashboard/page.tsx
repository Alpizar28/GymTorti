"use client";

import { useSearchParams } from "next/navigation";
import { FigmaApp } from "@/features/figma-app/FigmaApp";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? undefined;
  const defaultTab = tab === "pagos" ? "pagos" : tab === "mediciones" ? "mediciones" : tab === "clientes" ? "clientes" : undefined;
  return <FigmaApp defaultTab={defaultTab} />;
}
