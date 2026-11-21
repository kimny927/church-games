import Spinner from "./Spinner";

// 화면 전환 중 표시 (app/loading.tsx). 서버 응답 전에 바로 보여서 눌렸는지 알 수 있다
export default function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Spinner className="size-8" />
      <p className="text-sm">불러오는 중…</p>
    </div>
  );
}
