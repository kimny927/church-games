import NicknameForm from "@/components/admin/NicknameForm";
import NavLink from "@/components/ui/NavLink";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { owner: "최고 관리자", admin: "관리자" };

// 내 정보: 이메일·역할은 보기만(바꾸는 건 최고 관리자), 닉네임은 언제든 바꿀 수 있다
export default async function ProfilePage() {
  // 방금 바꾼 닉네임이 바로 보이도록 쿠키 캐시 대신 DB로 읽는다
  const { user } = await requireAdmin({ fresh: true });
  return (
    <div className="space-y-4">
      <NavLink href="/admin" className="text-sm text-blue-600">← 관리자 홈</NavLink>
      <h1 className="text-xl font-bold">내 정보</h1>
      <dl className="grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
        <dt className="font-semibold text-gray-600">이메일</dt>
        <dd className="break-all">{user.email}</dd>
        <dt className="font-semibold text-gray-600">역할</dt>
        <dd>{ROLE_LABEL[user.role ?? ""] ?? user.role}</dd>
      </dl>
      <NicknameForm current={user.name} />
      <NavLink href="/admin/password" className="block text-sm text-blue-600">비밀번호 변경 →</NavLink>
    </div>
  );
}
