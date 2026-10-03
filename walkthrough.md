# Walkthrough: 스쿼드 결원(Missing Skill) 2촌 탐색 & 사내 동료 소개 리퀘스트 (2nd-Degree Talent Bridge)

## 1. 개요 및 비즈니스 목적
상장사 사외이사·감사와 같은 명예직 거버넌스를 지양하고, **일반 핵심 실무 인재(개발자, 디자이너, PM, 마케터 등)** 중심의 프로젝트 빌딩 과정에서 내 1촌 인맥만으로 스쿼드의 핵심 기술(Missing Skill)을 충원하기 어려운 문제를 해결하였습니다.

사내 동료들이 안전하게 공유한 2촌 인맥 풀(총 8명, AWS/DevOps·React·LLM·UI/UX·B2B 세일즈 등)을 직무 스킬 기반으로 지능형 랭킹 매칭하고, 사내 동료에게 보낼 **정중한 소개 요청 서신 자동 합성**, **추천 감사 리워드(커피챗 5만, 입사/합류 40~70만)** 안내, 그리고 **가교 배정**까지 원터치로 연결하는 기능을 완성하였습니다.

---

## 2. 주요 구현 내용

### 1) 데이터 계층: 동료 공유 2촌 실무 인재 풀 구축 (Single Source of Truth)
- [teamNetwork.ts](file:///c:/Users/story/Desktop/ConnectWe/src/types/teamNetwork.ts): `TeamSharedContact`에 `skills?: string[]`, `primaryDomain?: string` 필드 확장
- [mockTeamNetwork.ts](file:///c:/Users/story/Desktop/ConnectWe/src/data/mockTeamNetwork.ts): 
  - 사내 동료 4명(`MOCK_TEAM_MEMBERS`: 정현우 테크리드, 이수민 프로덕트헤드, 박지훈 비즈니스디렉터, 강민석 시스템아키텍트)
  - 실무 2촌 인재 8명(`MOCK_PEER_SHARED_CONTACTS`: 강동원(AWS/K8s), 윤서진(React/Next.js), 문성호(LLM/RAG), 송하은(Design System), 장민수(B2B Sales) 등)

### 2) 서비스 계층: 2촌 인재 매칭 & 소개 서신 & 리워드 엔진
- [secondDegreeTalentBridgeService.ts](file:///c:/Users/story/Desktop/ConnectWe/src/services/secondDegreeTalentBridgeService.ts):
  - `findSecondDegreeCandidatesForRole`: 결원 롤 요구 스킬 대비 2촌 인재 스킬셋 지능형 랭킹 매칭 (0~100점).
  - `calculateReferralRewardEst`: 역할 난이도 및 희소성에 따른 사내 추천 감사 리워드 (커피챗 5만원, 정식 합류 40~70만원) 실시간 산출.
  - `generateColleagueIntroRequestMessage`: 사내 메신저(슬랙/잔디/카톡)로 가볍게 보낼 수 있는 예의 바르고 정중한 비즈니스 에티켓 소개 서신 템플릿 자동 생성.

### 3) 컴포넌트 계층: 팀 빌더 모달 UI 고도화
- [ProjectSquadBuilderModal.tsx](file:///c:/Users/story/Desktop/ConnectWe/src/components/modals/ProjectSquadBuilderModal.tsx):
  - 우측 패널 상단에 `[1촌 내 인맥]` / `[2촌 동료 인맥]` 세그먼트 전환 탭 추가.
  - 2촌 카드: 이름, 직장/직함, 매칭률 뱃지, 가교 동료 뱃지(`가교: 강민석`), 사내 추천 리워드 칩(`🎁 가벼운 티타임 5만 · 정식 합류 50만`) 렌더링.
  - `[📩 사내 소개 요청]` 원클릭 클립보드 복사 및 "✓ 복사됨" 시각 피드백.
  - `[가교 배정]` 원클릭으로 좌측 가상 스쿼드 슬롯에 즉시 배치되며, 슬롯 카드에 `2촌 가교` 뱃지 및 가교 동료 정보 표시.

---

## 3. 검증 결과 (Verification Gate)

| 검증 도구 | 실행 항목 및 대상 | 결과 | 비고 |
| :--- | :--- | :--- | :--- |
| **TypeScript (`tsc`)** | `npx tsc --noEmit` | **0 errors** (통과) | 무결점 엄격 타입 계약 |
| **Unit Tests (`Vitest`)** | `npm test -- --run` | **36 files, 142 tests passed** (100%) | `secondDegreeTalentBridgeService` 6개 전수 통과 |
| **Production Build** | `npm run build` | **Build Success (50.25s)** | 프로덕션 번들링 완료 |
| **Playwright E2E** | `npx playwright test --workers=1` | **29 suites, 29 passed** (100%) | 신규 E2E 및 기존 전체 회귀 테스트 통과 |

---

## 4. 커밋 & 원격 저장소 푸시
- `git add .`
- `git commit -m "feat(squad): implement 2nd-degree talent bridge and colleague intro request with passing E2E suites"`
- `git push origin main`
