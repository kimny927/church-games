// 검색 결과 글을 AI나 화면에 넘기기 전에 정리하고, 거르기용으로 비교하기 쉬운 모양으로 바꾼다.
// 이 폴더는 수집 전용 Worker에서 돌아서 Next.js 코드(@/ 경로, next/*)를 쓰지 않는다
import { decodeEntities } from "../../../src/lib/link-meta";

// 눈에 안 보이는 문자: 제어 문자, 폭이 0인 문자, 글자 방향을 바꾸는 문자, BOM.
// 사람에게는 안 보이고 AI에게만 보이는 지시를 숨기는 데 쓰일 수 있어서 지운다 (\t\n\r은 뒤에서 띄어쓰기로)
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
const TAG = /<[^>]*>/g;

// 글자 단위(코드 포인트)로 자른다. 이모지 같은 글자가 반으로 잘리지 않게
export function clip(s: string, max: number) {
  const chars = Array.from(s);
  return chars.length > max ? chars.slice(0, max).join("").trimEnd() + "…" : s;
}

// 태그 제거 → 엔티티 풀기 → 다시 태그 제거(&lt;b&gt;처럼 엔티티로 숨긴 태그) → 전각·호환 문자 정규화(NFKC) → 안 보이는 문자 제거 → 공백 정리
export function cleanText(raw: string | undefined, max: number) {
  if (!raw) return "";
  const s = decodeEntities(raw.replace(TAG, " "))
    .replace(TAG, " ")
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();
  return clip(s, max);
}

// 비교용: 소문자, 한글·영문·숫자만 남기고 붙여 쓴다. '신.천.지', '신 천 지'가 '신천지'가 된다
export const compact = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^0-9a-z가-힣]/g, "");

// 비교용: 기호만 지우고 띄어쓰기는 남긴다. 짧은 낱말을 '낱말 시작'에서만 찾을 때 쓴다
export const spaced = (s: string) =>
  s.normalize("NFKC").toLowerCase().replace(/[^0-9a-z가-힣\s]/g, "").replace(/\s+/g, " ").trim();
