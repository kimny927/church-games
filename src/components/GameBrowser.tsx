"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FILTERS, type Game } from "@/lib/types";

type FilterKey = keyof typeof FILTERS;

const LABELS: Record<FilterKey, string> = {
  gameTypes: "게임 유형",
  budget: "예산",
  ages: "대상 나이",
  duration: "소요 시간",
  groupSize: "인원",
  tags: "태그",
};

function matches(game: Game, key: FilterKey, selected: string[]) {
  if (selected.length === 0) return true;
  const value = game[key];
  const values = Array.isArray(value) ? value : [value];
  return selected.some((s) => (values as string[]).includes(s));
}

export default function GameBrowser({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({
    gameTypes: [], budget: [], ages: [], duration: [], groupSize: [], tags: [],
  });

  const toggle = (key: FilterKey, option: string) =>
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key].includes(option) ? prev[key].filter((o) => o !== option) : [...prev[key], option],
    }));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((g) => {
      const text = [g.name, g.summary, g.verse ?? "", ...g.tags].join(" ").toLowerCase();
      if (q && !text.includes(q)) return false;
      return (Object.keys(FILTERS) as FilterKey[]).every((k) => matches(g, k, selected[k]));
    });
  }, [games, query, selected]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="게임 이름, 말씀(예: 여호수아), 태그로 검색"
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
      />

      <div className="mt-4 space-y-2">
        {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
          <div key={key} className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-600">{LABELS[key]}</span>
            {FILTERS[key].map((option) => {
              const on = selected[key].includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggle(key, option)}
                  className={`rounded-full border px-3 py-1 text-sm ${on ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">게임 {results.length}개</p>
      <ul className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((g) => (
          <li key={g.id}>
            <Link href={`/games/${g.id}`} className="block h-full rounded-xl border border-gray-200 p-4 hover:shadow-md">
              <p className="text-xs text-gray-500">{g.sourceType} · {g.duration} · {g.groupSize}</p>
              <h2 className="mt-1 text-lg font-bold">{g.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-gray-700">{g.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {g.tags.map((t) => (
                  <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">#{t}</span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="mt-8 text-center text-gray-500">조건에 맞는 게임이 없어요.</p>}
    </div>
  );
}
