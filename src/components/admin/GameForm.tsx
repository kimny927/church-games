"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionState } from "@/app/admin/admins/actions";
import { createGameAction, fetchLinkMetaAction, updateGameAction } from "@/app/admin/games/actions";
import SubmitButton from "@/components/ui/SubmitButton";
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

  // 링크에서 정보를 가져와 비어 있는 칸만 채운다. 이미 쓴 이름·고른 소스 종류는 덮어쓰지 않는다.
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
            <div className="flex gap-3">
              {meta.meta.image && (
                // 미리보기용. 외부 이미지라 next/image 대신 img, 원본 사이트가 referer로 막지 않게 no-referrer
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.meta.image} alt="" referrerPolicy="no-referrer" className="h-16 w-24 shrink-0 rounded object-cover" />
              )}
              <div className="min-w-0 space-y-1">
                {meta.meta.title && <p className="font-medium">{meta.meta.title}</p>}
                {meta.meta.description && (
                  <>
                    <p className="text-gray-700">{meta.meta.description}</p>
                    <p className="text-xs text-gray-500">원문 설명은 참고용이에요. 저장되지 않으니 소개글은 직접 요약해 주세요.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <Select name="sourceType" label="소스 종류" options={SOURCE_TYPES} value={game?.sourceType} />
      <Field label="게임 이름 *">
        <input name="name" required maxLength={100} defaultValue={game?.name} className={input} />
      </Field>
      <Field label="소개글 *" hint="원문을 복사하지 말고 직접 요약해 주세요 (저작권). 자세한 방법은 원본 링크로 안내돼요.">
        <textarea name="summary" required maxLength={1000} rows={4} defaultValue={game?.summary} className={input} />
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
