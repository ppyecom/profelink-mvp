import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { MessageCircle, ChevronRight } from "lucide-react";
import InboxClient from "@/components/inbox/InboxClient";

export const metadata = { title: "Mensajes — ProfeLink" };

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <InboxClient />;
}
