import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 지금은 SSR만 쓰므로 캐시 설정이 필요 없다. ISR을 쓰게 되면 여기에 R2 incrementalCache를 추가한다.
export default defineCloudflareConfig({});
