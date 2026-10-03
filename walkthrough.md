# Walkthrough: 🚀 초기 스타트업 창업 & 시드 펀딩 레이더 (Early-Stage Founder & Stealth Radar)

## 1. 개요 및 비즈니스 목적
상장사 사외이사·감사와 같은 명예직 거버넌스를 배제하고, **일반 핵심 실무 인재(개발자, 디자이너, PM, 마케터, 스타트업 파운더 등)** 중심의 실전적 비즈니스 네트워크 확장을 위해 동문·전 직장 동료들의 **스텔스 창업, 초기 법인 설립, 팁스(TIPS) 선정, Seed/Pre-A 라운드 투자 유치 신호**를 조기 감지하는 인텔리전스 시스템을 구축하였습니다.

특히, 감지된 창업자에게 **1-Click 응원 및 모닝 커피챗 서신 자동 합성**, 그리고 직전 구현된 **「스마트 프로젝트 팀 빌더(`ProjectSquadBuilderModal`)」**와의 원클릭 연동을 통해 창업팀의 결원 실무 롤(Missing Skill: AI테크리드, 백엔드/인프라 등)을 즉시 채워줄 수 있는 상호 호혜적 시너지를 완성하였습니다.

---

## 2. 주요 구현 내용

### 1) 데이터 모델 & 타입 계층
- [ventureRadar.ts](file:///c:/Users/story/Desktop/ConnectWe/src/types/ventureRadar.ts):
  - `EarlyStageVentureSignal`: 고유 식별자, 창업자 인적 정보, 회사명, 역할(`FOUNDER_CEO`, `CO_FOUNDER_CTO`, `STEALTH_BUILDER`), 펀딩 단계(`STEALTH`, `SEED_TIPS`, `PRE_SEED`, `SERIES_A`), 감지 신호(`TIPS_SELECTION`, `GITHUB_ORG_LAUNCH` 등), 기술 포커스, 피치 요약, 결원 롤(`missingRoles: SquadRoleId[]`), 응원 전달 여부.
  - `VentureSummaryStats`: 감지 시그널 수, 단계별 카운트, 응원 완료 집계.

### 2) 서비스 & 비즈니스 로직 계층
- [ventureRadarService.ts](file:///c:/Users/story/Desktop/ConnectWe/src/services/ventureRadarService.ts):
  - `loadVentureSignals`: 인맥 데이터와 연동된 초기 창업 및 시드 유치 시그널 목록 로드 (로컬 스토리지 및 인-메모리 캐시 영속화).
  - `filterVentureSignals`: 스테이지(`ALL`, `STEALTH`, `SEED_TIPS`, `SERIES_A`) 및 성명/회사명/기술 검색어 실시간 필터링.
  - `generateFounderCheerMessage`: 인간 중심의 품격 있고 따뜻한 응원 및 캐주얼 티타임 서신 자동 합성.
  - `markSignalCongratulated`: 응원 서신 복사 시 완료 상태 및 타임스탬프 영속화.
  - `getVentureSummaryStats`: 메트릭 집계 산출.
- [ventureRadarService.test.ts](file:///c:/Users/story/Desktop/ConnectWe/src/services/__tests__/ventureRadarService.test.ts): 6개 단위 테스트 100% 무결점 통과.

### 3) 컴포넌트 & 모달 UI 계층
- [EarlyStageVentureRadarModal.tsx](file:///c:/Users/story/Desktop/ConnectWe/src/components/modals/EarlyStageVentureRadarModal.tsx):
  - 상단 헤더 및 4대 퀵 메트릭 칩(총 감지, 스텔스 모드, 시드 & TIPS, 응원 완료 현황).
  - 스테이지 탭 세그먼트 버튼 및 실시간 검색 인풋 바.
  - 창업자 카드 그리드: 직함 뱃지, 펀딩 스테이지 뱃지, 감지 출처, 기술 포커스 및 피치 요약.
  - **창업팀 결원 롤 뱃지(Missing Skill)**: `+ 백엔드/인프라`, `+ AI/LLM 리드` 등 실무 결원 시각화.
  - 액션 버튼:
    - `[💌 응원 & 티타임 서신]`: 원클릭 클립보드 복사 및 "✓ 서신 복사됨" 피드백.
    - `[👥 파운딩 스쿼드 빌딩]`: 클릭 시 창업팀 결원을 즉시 채울 수 있도록 `ProjectSquadBuilderModal`로 매끄러운 전이 연결.

### 4) 전역 접점 및 뷰 연동
- [App.tsx](file:///c:/Users/story/Desktop/ConnectWe/src/App.tsx): 모달 지연 로딩(`React.lazy`), 상태(`isVentureRadarOpen`), 파운딩 스쿼드 빌더 전이 핸들러 바인딩.
- [GlobalCommandPalette.tsx](file:///c:/Users/story/Desktop/ConnectWe/src/components/common/GlobalCommandPalette.tsx): '창업', '스타트업', '시드', '파운더', 'tips', 'stealth' 검색 시 즉시 호출 액션 연동.
- [GeneralMemberView.tsx](file:///c:/Users/story/Desktop/ConnectWe/src/components/views/GeneralMemberView.tsx): 일반 회원 뷰 상단 퀵 액션 바에 `[🚀 창업 & 시드 레이더]` 전용 버튼 배치.

---

## 3. 검증 결과 (Verification Gate)

| 검증 도구 | 실행 항목 및 대상 | 결과 | 비고 |
| :--- | :--- | :--- | :--- |
| **TypeScript (`tsc`)** | `npx tsc --noEmit` | **0 errors** (통과) | 무결점 엄격 타입 계약 |
| **Unit Tests (`Vitest`)** | `npm test -- --run` | **39 files, 156 tests passed** (100%) | `ventureRadarService` 등 전수 통과 |
| **Production Build** | `npm run build` | **Build Success (1m 40s)** | 독립 청크 분리 및 최적화 번들링 완료 |
| **Playwright E2E** | `npx playwright test --workers=1` | **31 suites, 31 passed** (100%) | 신규 E2E 및 전체 회귀 테스트 100% 무결점 통과 |

---

## 4. 커밋 & GitHub 푸시
- `git add .`
- `git commit -m "feat(venture): implement early-stage founder and seed funding radar with 31 passing E2E suites"`
- `git push origin main`
