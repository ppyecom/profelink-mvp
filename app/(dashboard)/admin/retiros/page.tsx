import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminRetirosClient from "@/components/admin/AdminRetirosClient";

export const metadata = { title: "Retiros — Admin ProfeLink" };

export default async function AdminRetirosPage() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") redirect("/login");
  return <AdminRetirosClient />;
}
