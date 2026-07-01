import { getSession } from "@/shared/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/shared/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <DashboardShell>{children}</DashboardShell>;
}
