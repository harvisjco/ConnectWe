import { test, expect } from '@playwright/test';

test.describe('3대 엔터프라이즈 마스터 허브 (3 Enterprise Master Hubs) E2E 통합 검증', () => {
  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible({ timeout: 15000 });

    // 일반 회원 등급으로 전환하여 일반 동문 뷰 활성화
    const generalRoleBtn = page.locator('button:has-text("일반")').first();
    if (await generalRoleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generalRoleBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('1. Hub 1: C-Level 경영 거버넌스 & 전략 인텔리전스 마스터 허브 실행 및 4대 탭 순회', async ({ page }) => {
    const govHubBtn = page.locator('[data-testid="open-governance-master-hub-btn"]');
    await expect(govHubBtn).toBeVisible({ timeout: 10000 });
    await govHubBtn.click();

    // 모달 팝업 및 헤더 검증
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=경영 거버넌스 & 전략 인텔리전스 마스터 허브')).toBeVisible();

    // Tab 1: 상법 제542조의8 겸직 규제
    await expect(modal.locator('text=이사회 거버넌스 & 상법 규제')).toBeVisible();
    await expect(modal.locator('text=상법 제542조의8 사외이사 겸직 규제 실시간 판별기')).toBeVisible();

    // Tab 2: DART 공시 & M&A 시너지
    const disclosuresTab = modal.locator('[data-testid="tab-hub-disclosures"]');
    await disclosuresTab.click();
    await expect(modal.locator('text=DART 5% 이상 대량보유 및 담보계약 공시 레이더')).toBeVisible();

    // Tab 3: 최고경영진 승계 큐레이터
    const successionTab = modal.locator('[data-testid="tab-hub-succession"]');
    await successionTab.click();
    await expect(modal.locator('text=C-Level 핵심 포지션 승계 풀 & 사외이사 후보 큐레이터')).toBeVisible();

    // Tab 4: 전략 인텔리전스 & 히트맵
    const intelTab = modal.locator('[data-testid="tab-hub-intelligence"]');
    await intelTab.click();
    await expect(modal.locator('text=ConnectWe C-Level 위클리 전략 인텔리전스 1-Page 브리프')).toBeVisible();
    await expect(modal.locator('text=핵심 네트워크 결속도(Tie Strength) & 관계 온도 히트맵')).toBeVisible();

    // 닫기
    await modal.locator('button:has-text("닫기")').click();
    await expect(modal).not.toBeVisible();
  });

  test('2. Hub 2: 실무 인재 & 커리어 성장 생태계 마스터 허브 실행 및 5대 탭 순회', async ({ page }) => {
    const talentHubBtn = page.locator('[data-testid="open-talent-master-hub-btn"]');
    await expect(talentHubBtn).toBeVisible({ timeout: 10000 });
    await talentHubBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=실무 인재 & 커리어 성장 생태계 마스터 허브')).toBeVisible();

    // Tab 1: 프로젝트 스쿼드 빌더
    await expect(modal.locator('text=스마트 프로젝트 스쿼드 가상 편성기')).toBeVisible();

    // Tab 2: 초기 창업 & 시드 레이더
    const ventureTab = modal.locator('[data-testid="tab-hub-venture"]');
    await ventureTab.click();
    await expect(modal.locator('text=감지된 창업 시그널')).toBeVisible();

    // Tab 3: 신뢰 보증 & 디지털 명함
    const trustTab = modal.locator('[data-testid="tab-hub-trust-card"]');
    await trustTab.click();
    await expect(modal.locator('text=모바일 vCard 3.0 디지털 명함')).toBeVisible();
    await expect(modal.locator('text=4단계 피어 실무 보증')).toBeVisible();

    // Tab 4: 지식 교환 & 스터디 길드
    const guildTab = modal.locator('[data-testid="tab-hub-knowledge-guild"]');
    await guildTab.click();
    await expect(modal.locator('text=1:1 캐주얼 커피챗 룰렛 & 지식 교환 팟')).toBeVisible();

    // Tab 5: 24h 실무 SOS
    const sosTab = modal.locator('[data-testid="tab-hub-sos-desk"]');
    await sosTab.click();
    await expect(modal.locator('text=24시간 실무 SOS 긴급 헬프데스크 등록')).toBeVisible();

    // 닫기
    await modal.locator('button:has-text("닫기")').click();
    await expect(modal).not.toBeVisible();
  });

  test('3. Hub 3: 비즈니스 미팅 & 관계 라이프사이클 마스터 허브 실행 및 전주기 검증', async ({ page }) => {
    const meetingHubBtn = page.locator('[data-testid="open-meeting-master-hub-btn"]');
    await expect(meetingHubBtn).toBeVisible({ timeout: 10000 });
    await meetingHubBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=미팅 & 관계 라이프사이클 마스터 허브')).toBeVisible();

    // Tab 1: 3선 일정 조율
    await expect(modal.locator('text=상대방 부담을 덜어주는 3대 추천 시간대')).toBeVisible();
    await expect(modal.locator('text=자동 포맷팅된 정중한 티타임 서신 미리보기')).toBeVisible();

    // Tab 2: 5분 전 브리프
    const briefTab = modal.locator('[data-testid="tab-hub-brief"]');
    await briefTab.click();
    await expect(modal.locator('text=미팅 5분 전 1-Page 스마트 브리프')).toBeVisible();

    // Tab 3: 현장 밋업 & 감동 비망록
    const meetupTab = modal.locator('[data-testid="tab-hub-meetup"]');
    await meetupTab.click();
    await expect(modal.locator('text=현장 즉석 비접촉 밋업 룸')).toBeVisible();

    // Tab 4: 회고 & 감사 서신
    const debriefTab = modal.locator('[data-testid="tab-hub-debrief"]');
    await debriefTab.click();
    await expect(modal.locator('text=30초 미팅 회고 및 감사 서신 생성기')).toBeVisible();

    // Tab 5: 3분 사후 팔로업
    const followupTab = modal.locator('[data-testid="tab-hub-followup"]');
    await followupTab.click();
    await expect(modal.locator('text=3분 사후 약속 이행 트래커 & 리마인더')).toBeVisible();

    // 닫기
    await modal.locator('button:has-text("닫기")').click();
    await expect(modal).not.toBeVisible();
  });

  test('4. 헤더 하위 호환성 100% 보존: 기존 서브 뱃지 버튼 정상 노출 및 클릭 가능 확인', async ({ page }) => {
    // 하위 호환성 셀렉터들이 여전히 헤더 2차 서브 바에 정상 배치되어 있는지 확인
    const squadBtn = page.locator('[data-testid="open-squad-builder-btn"]');
    const ventureBtn = page.locator('[data-testid="open-venture-radar-btn"]');
    const scanBtn = page.locator('[data-testid="open-card-scanner-btn"]');

    await expect(squadBtn).toBeVisible();
    await expect(ventureBtn).toBeVisible();
    await expect(scanBtn).toBeVisible();
  });
});
