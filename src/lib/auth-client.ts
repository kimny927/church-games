// 브라우저용 Better Auth 클라이언트. /api/auth/* 를 호출하므로 요청 제한이 적용된다.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
