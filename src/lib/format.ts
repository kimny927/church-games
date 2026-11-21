// 서버·브라우저 어디서 그려도 같은 문자열이 나오도록 시간대를 고정한다
export const formatDateTime = (d: Date) =>
  new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" });
