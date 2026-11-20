import Link from "next/link";
import { headers } from "next/headers";
import AddAdminForm from "@/components/admin/AddAdminForm";
import AdminRow from "@/components/admin/AdminRow";
import { requireAdmin } from "@/lib/admin";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const { user: me } = await requireAdmin({ role: "owner" });
  const { users } = await getAuth().api.listUsers({
    query: { limit: 100, sortBy: "createdAt", sortDirection: "asc" },
    headers: await headers(),
  });
  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-blue-600">← 관리자 홈</Link>
      <h1 className="text-xl font-bold">관리자 관리</h1>
      <AddAdminForm />
      <ul className="space-y-2">
        {users.map((u) => (
          <AdminRow
            key={u.id}
            id={u.id}
            email={u.email}
            name={u.name}
            role={u.role ?? "admin"}
            mustChangePassword={Boolean((u as { mustChangePassword?: boolean }).mustChangePassword)}
            isMe={u.id === me.id}
          />
        ))}
      </ul>
    </div>
  );
}
