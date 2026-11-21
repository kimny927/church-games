import LoadingScreen from "@/components/ui/LoadingScreen";

// 사용자 페이지는 요청마다 DB를 읽어서(SSR), 링크를 누르면 응답 전까지 이 화면을 먼저 보여 준다.
// (site) 그룹 안에만 두는 이유: 관리자 화면까지 감싸면 응답을 먼저 보내서 requireAdmin의 redirect가 307이 아니게 된다
export default LoadingScreen;
