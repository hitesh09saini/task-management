import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Shell from "./Shell";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const safeUser = {
    id: user.sub,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return <Shell user={safeUser}>{children}</Shell>;
}
