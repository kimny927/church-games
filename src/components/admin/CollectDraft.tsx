import { formatDateTime } from "@/lib/format";
import type { CollectMeta } from "@/lib/types";

// 자동 수집 게임의 심의 세부: 검색 API가 준 원문 요약과 AI가 쓴 추천 문구(원래 문구)를 나란히 놓고 비교한다.
// 실제로 보일 소개글은 이 상자 밖(위)에 따로 보여 준다. 원문 요약은 믿을 수 없는 글이라 텍스트로만 그린다
export default function CollectDraft({ meta }: { meta?: CollectMeta }) {
  const published = meta?.publishedAt ? new Date(meta.publishedAt) : undefined;
  const facts = meta && [
    ["검색어", meta.keyword],
    ["AI 확신도", `${Math.round(meta.confidence * 100)}%`],
    ["글쓴이", meta.author],
    ["글 날짜", published && !isNaN(published.getTime()) ? formatDateTime(published) : undefined],
    ["모델", meta.model],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <section className="space-y-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
      <h2 className="font-semibold text-amber-800">AI 초안 · 원본과 비교해 주세요</h2>
      {/* 휴대폰에서는 위아래, 넓은 화면에서는 나란히 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500">원문 요약 (검색 결과)</p>
          <p className="leading-relaxed break-words whitespace-pre-line text-gray-700">
            {meta?.snippet || "원문 요약 없음"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500">AI 추천 문구</p>
          <p className="leading-relaxed break-words whitespace-pre-line">
            {meta?.aiSummary || <span className="text-gray-400">추천 문구가 저장되지 않은 예전 수집분이에요</span>}
          </p>
        </div>
      </div>
      {facts && facts.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-gray-600">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-gray-400">{k}</dt>
              <dd className="break-all">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-xs text-amber-700">
        AI 내용은 틀릴 수 있어요. 승인 전에 위의 &apos;원본 보기&apos;로 글을 직접 확인하고, 소개글은 &apos;수정&apos;에서 고칠 수 있어요.
      </p>
    </section>
  );
}
