-- 샘플 게임 3개 (src/lib/sample-games.ts 와 같은 내용). schema.sql 다음에 실행하세요.
-- 링크는 예시 주소라 실제 게임 링크로 교체해야 해요.

insert into games (id, name, kind, summary, link, source_type, tags, verse, game_types, budget, ages, duration, group_size, supplies, status, approved_by, approved_at)
values
  ('bible-character-quiz', '성경 인물 스무고개', '외부 링크',
   '한 사람이 성경 인물을 떠올리고, 나머지가 예/아니오 질문 20개로 맞히는 게임. 준비물 없이 바로 할 수 있어요.',
   'https://example.com/bible-20-questions', '블로그',
   '{아이스브레이킹,말씀 묵상,실내}', '히브리서 11장', '{두뇌형}', '무료',
   '{초등부,중고등부,청년부}', '10~30분', '소그룹(~10명)', null,
   'approved', 'seed', now()),

  ('jericho-relay', '여리고성 무너뜨리기 릴레이', '외부 링크',
   '종이컵으로 성을 쌓고 팀별로 공을 던져 무너뜨리는 팀 대항 게임. 여호수아 6장 말씀과 연결해 진행해요.',
   'https://example.com/jericho-relay', '유튜브',
   '{팀 대항,레크리에이션,실내}', '여호수아 6장', '{신체형}', '1만원 이하',
   '{초등부,중고등부,청년부}', '30분~1시간', '대그룹(30명 이상)', '종이컵 100개, 작은 공 4개',
   'approved', 'seed', now()),

  ('verse-puzzle', '말씀 구절 퍼즐 맞추기', '외부 링크',
   '말씀 구절을 단어 카드로 잘라 섞어두고 팀별로 먼저 순서대로 맞추는 게임.',
   'https://example.com/verse-puzzle', '인스타그램',
   '{팀 대항,말씀 묵상,실내}', '시편 23편', '{두뇌형}', '무료',
   '{중고등부,청년부,장년부}', '10분 이내', '중그룹(10~30명)', '인쇄한 단어 카드',
   'approved', 'seed', now());
