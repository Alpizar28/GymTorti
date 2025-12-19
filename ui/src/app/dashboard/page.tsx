import { FigmaApp } from "@/features/figma-app/FigmaApp";

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tab = searchParams?.tab;
  const defaultTab = tab === "pagos" ? "pagos" : tab === "mediciones" ? "mediciones" : tab === "clientes" ? "clientes" : undefined;
  return <FigmaApp defaultTab={defaultTab} />;
}
