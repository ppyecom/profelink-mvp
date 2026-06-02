import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminCredencialesClient from "@/components/admin/AdminCredencialesClient";

export const metadata = { title: "Credenciales — Admin ProfeLink" };

export default async function AdminCredencialesPage() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") redirect("/login");
  return <AdminCredencialesClient />;
}
