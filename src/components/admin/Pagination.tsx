import NavLink from "@/components/ui/NavLink";

// 관리자 목록의 쪽 넘기기: [이전] 3 / 12쪽 [다음]. 한 쪽뿐이면 그리지 않는다
// href(n)는 n쪽 주소를 만든다 (탭 같은 다른 조건은 부르는 쪽이 붙임)
export default function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const button = "rounded border px-3 py-1";
  const off = `${button} text-gray-300`;
  return (
    <nav aria-label="쪽 넘기기" className="flex items-center justify-between text-sm">
      {page > 1 ? <NavLink href={href(page - 1)} className={button}>← 이전</NavLink> : <span className={off}>← 이전</span>}
      <span className="text-gray-600">{page} / {totalPages}쪽</span>
      {page < totalPages ? <NavLink href={href(page + 1)} className={button}>다음 →</NavLink> : <span className={off}>다음 →</span>}
    </nav>
  );
}
