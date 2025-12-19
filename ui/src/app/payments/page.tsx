import { redirect } from "next/navigation";

export default function PaymentsPage() {
  redirect("/dashboard?tab=pagos");
}

