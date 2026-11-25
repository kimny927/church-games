"use client";

import { useEffect, useRef, useState } from "react";

// 게임 썸네일. 원본 사이트의 이미지를 그대로 불러온다 (저장하지 않음)
// - 외부 주소라 만료(인스타그램)·차단(referer 확인)될 수 있어서, 없거나 깨지면 기본 모양(회색 상자 + fallback 글자)
// - next/image 최적화는 Workers에서 따로 설정이 필요해서 일반 img를 쓴다
export default function Thumbnail({ src, fallback, className = "" }: { src?: string; fallback: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const ref = useRef<HTMLImageElement>(null);

  // 서버에서 그린 img는 React가 붙기 전에 이미 실패했을 수 있다 (그러면 onError를 놓친다). 붙은 뒤 한 번 더 본다
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && src) setFailedSrc(src);
  }, [src]);

  if (!src || failedSrc === src) {
    return <div className={`flex items-center justify-center bg-gray-100 text-sm text-gray-400 ${className}`}>{fallback}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer" // 네이버 이미지처럼 다른 사이트에서 불러오면 막는 곳 대비
      onError={() => setFailedSrc(src)}
      className={`bg-gray-100 object-cover ${className}`}
    />
  );
}
