"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionState } from "@/app/admin/admins/actions";
import { createGameAction, fetchLinkMetaAction, updateGameAction } from "@/app/admin/games/actions";
import CopyButton from "@/components/ui/CopyButton";
import SubmitButton from "@/components/ui/SubmitButton";
import Thumbnail from "@/components/ui/Thumbnail";
import { FILTERS, SOURCE_TYPES, type ModerationGame } from "@/lib/types";
import ActionMessage from "./ActionMessage";

const input = "w-full rounded border px-3 py-2";

type LinkMetaResult = Awaited<ReturnType<typeof fetchLinkMetaAction>>;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Select({ name, label, options, value }: { name: string; label: string; options: readonly string[]; value?: string }) {
  return (
    <Field label={`${label} *`}>
      <select name={name} required defaultValue={value ?? ""} className={input}>
        <option value="" disabled>골라 주세요</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
}

// 여러 개 고르는 칸. 휴대폰에서 누르기 쉽게 칩 모양 체크박스로
function Checks({ name, label, options, values = [] }: { name: string; label: string; options: readonly string[]; values?: string[] }) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
            <input type="checkbox" name={name} value={o} defaultChecked={values.includes(o)} className="accent-blue-600" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// 등록·수정 같은 폼. game이 있으면 수정
export default function GameForm({ game }: { game?: ModerationGame }) {
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();
  const [meta, setMeta] = useState<LinkMetaResult | null>(null);
  const [fetching, startFetching] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // 썸네일은 직접 쓰는 칸이 아니라서 state로 두고 숨은 칸으로 보낸다
  const [thumbnail, setThumbnail] = useState(game?.thumbnailUrl ?? "");
  // 자동 수집 게임: 원문 요약·AI 추천 문구를 소개글 옆에 참고로 보여 준다 (폼 값이 아니라 저장되지 않음)
  const collectMeta = game?.autoScraped ? game.collectMeta : undefined;
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  // '소개글에 넣기': 소개글 칸을 AI 추천 문구로 바꾼다. 직접 고친 내용이 있으면 덮어쓰기 전에 묻는다
  function applySuggestion(text: string) {
    const box = summaryRef.current;
    if (!box) return;
    if (box.value.trim() && box.value !== text && !confirm("지금 쓴 소개글을 AI 추천 문구로 바꿀까요?")) return;
    box.value = text;
    box.focus();
  }

  // 링크에서 정보를 가져와 비어 있는 칸만 채운다. 이미 쓴 이름·고른 소스 종류는 덮어쓰지 않는다.
  // 썸네일은 직접 쓴 값이 아니라서 새로 가져온 이미지가 있으면 바꾼다 (없으면 기존 것 유지)
  // 칸들이 defaultValue(비제어)라서 state 대신 폼 요소에 값을 직접 넣는다
  function onFetchMeta() {
    const form = formRef.current;
    if (!form) return;
    const link = form.elements.namedItem("link") as HTMLInputElement;
    if (!link.reportValidity()) return;
    setMeta(null);
    startFetching(async () => {
      const result = await fetchLinkMetaAction(link.value);
      setMeta(result);
      if (!result.ok) return;
      const name = form.elements.namedItem("name") as HTMLInputElement;
      const sourceType = form.elements.namedItem("sourceType") as HTMLSelectElement;
      if (!name.value.trim() && result.meta.title) name.value = result.meta.title;
      if (!sourceType.value) sourceType.value = result.meta.sourceType;
      if (result.meta.image) setThumbnail(result.meta.image);
    });
  }

  // <form action>을 쓰면 React 19가 제출 후 입력값을 비워서, 오류가 나면 쓴 내용이 다 사라진다.
  // 그래서 onSubmit에서 서버 액션을 직접 부른다. 성공하면 서버가 심의 화면으로 보낸다(redirect)
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState(null);
    startTransition(async () => {
      setState(await (game ? updateGameAction : createGameAction)(null, form));
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {game && <input type="hidden" name="id" value={game.id} />}
      {/* 버튼이 <label> 안에 있으면 라벨을 누를 때 버튼이 눌릴 수 있어서 Field 대신 따로 만든다 */}
      <div className="space-y-1">
        <label htmlFor="game-link" className="text-sm font-medium">원본 링크 *</label>
        <div className="flex gap-2">
          <input id="game-link" name="link" type="url" required defaultValue={game?.link} placeholder="https://" className={input} />
          <SubmitButton
            type="button"
            onClick={onFetchMeta}
            pending={fetching}
            pendingText="가져오는 중…"
            className="shrink-0 rounded border px-3 py-2 text-sm"
          >
            정보 가져오기
          </SubmitButton>
        </div>
        <span className="block text-xs text-gray-500">{"블로그·유튜브·인스타그램 등 게임을 소개한 원래 글. '정보 가져오기'를 누르면 비어 있는 이름·소스 종류를 채워요."}</span>
      </div>
      {meta && (
        <div className={`rounded p-3 text-sm ${meta.ok ? "bg-gray-50" : "bg-red-50 text-red-700"}`}>
          {!meta.ok ? (
            <p>{meta.message}</p>
          ) : (
            <div className="min-w-0 space-y-1">
              {meta.meta.title && <p className="font-medium">{meta.meta.title}</p>}
              {meta.meta.description && (
                <>
                  <p className="text-gray-700">{meta.meta.description}</p>
                  <p className="text-xs text-gray-500">원문 설명은 참고용이에요. 저장되지 않으니 소개글은 직접 요약해 주세요.</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
      <div className="space-y-1">
        <span className="text-sm font-medium">썸네일</span>
        <input type="hidden" name="thumbnailUrl" value={thumbnail} />
        <div className="flex items-end gap-3">
          <Thumbnail src={thumbnail || undefined} fallback="없음" className="aspect-video w-40 shrink-0 rounded" />
          {thumbnail && (
            <button type="button" onClick={() => setThumbnail("")} className="rounded border px-3 py-1 text-sm">
              썸네일 빼기
            </button>
          )}
        </div>
        <span className="block text-xs text-gray-500">{"'정보 가져오기'로 원본의 대표 이미지를 가져와요. 원본 사이트의 이미지를 그대로 보여 주므로 나중에 깨질 수 있어요."}</span>
      </div>
      <Select name="sourceType" label="소스 종류" options={SOURCE_TYPES} value={game?.sourceType} />
      <Field label="게임 이름 *">
        <input name="name" required maxLength={100} defaultValue={game?.name} className={input} />
      </Field>
      {collectMeta && (
        <div className="space-y-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="text-xs font-semibold text-amber-800">자동 수집 참고 (저장되지 않아요)</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">원문 요약 (검색 결과)</span>
              {collectMeta.snippet && <CopyButton text={collectMeta.snippet} />}
            </div>
            <p className="leading-relaxed break-words whitespace-pre-line text-gray-700">{collectMeta.snippet || "원문 요약 없음"}</p>
            <p className="text-xs text-gray-500">참고용이에요. 그대로 옮기지 말고 요약해 주세요 (저작권).</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">AI 추천 문구</span>
              {collectMeta.aiSummary && (
                <span className="flex gap-1">
                  <CopyButton text={collectMeta.aiSummary} />
                  <button type="button" onClick={() => applySuggestion(collectMeta.aiSummary!)} className="rounded border bg-white px-2 py-0.5 text-xs">
                    소개글에 넣기
                  </button>
                </span>
              )}
            </div>
            <p className="leading-relaxed break-words whitespace-pre-line">
              {collectMeta.aiSummary || <span className="text-gray-400">추천 문구가 저장되지 않은 예전 수집분이에요</span>}
            </p>
          </div>
        </div>
      )}
      <Field label="소개글 *" hint="원문을 복사하지 말고 직접 요약해 주세요 (저작권). 자세한 방법은 원본 링크로 안내돼요.">
        <textarea ref={summaryRef} name="summary" required maxLength={1000} rows={4} defaultValue={game?.summary} className={input} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select name="budget" label="예산" options={FILTERS.budget} value={game?.budget} />
        <Select name="duration" label="소요 시간" options={FILTERS.duration} value={game?.duration} />
        <Select name="groupSize" label="인원" options={FILTERS.groupSize} value={game?.groupSize} />
      </div>
      <Checks name="gameTypes" label="게임 유형" options={FILTERS.gameTypes} values={game?.gameTypes} />
      <Checks name="ages" label="대상 나이" options={FILTERS.ages} values={game?.ages} />
      <Checks name="tags" label="태그" options={FILTERS.tags} values={game?.tags} />
      <Field label="관련 말씀">
        <input name="verse" maxLength={100} defaultValue={game?.verse} placeholder="예: 여호수아 6장" className={input} />
      </Field>
      <Field label="준비물">
        <input name="supplies" maxLength={300} defaultValue={game?.supplies} className={input} />
      </Field>
      <ActionMessage state={state} />
      <SubmitButton pending={pending} pendingText="저장 중…" className="w-full rounded bg-blue-600 py-2 font-semibold text-white">
        {game ? "수정 저장" : "등록 (심의 대기로)"}
      </SubmitButton>
    </form>
  );
}
