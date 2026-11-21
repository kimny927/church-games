// 공통 로딩 아이콘. 테마를 바꿀 때는 src/components/ui/ 만 고친다
export default function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="로딩 중"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
