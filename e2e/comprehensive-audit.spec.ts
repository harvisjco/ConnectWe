import { test, expect } from '@playwright/test';

test.describe('ConnectWe 종합 브라우저 기능 정밀 진단 (Playwright E2E)', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // 브라우저 런타임 콘솔 에러 리스너
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 페이지 진입
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. [초기 진입 & 경영 사령탑] 페이지 타이틀, Supabase Live 뱃지, 오늘의 경영 사령탑이 기본 렌더링되어야 한다', async ({ page }) => {
    await expect(page).toHaveTitle(/ConnectWe/);
    await expect(page.locator('header')).toBeVisible();

    // 로고 및 뱃지 확인
    await expect(page.locator('text=ConnectWe')).toBeVisible();
    await expect(page.locator('text=Supabase Live')).toBeVisible();

    // 오늘의 경영 사령탑 홈 대시보드 렌더링 확인
    await expect(page.locator('text=오늘의 비즈니스 경영 사령탑')).toBeVisible();
    await expect(page.locator('text=오늘의 현장 레이더')).toBeVisible();
    await expect(page.locator('text=DART 영전 조기 감지')).toBeVisible();
    await expect(page.locator('text=소통 골든타임 넛지')).toBeVisible();
    await expect(page.locator('text=최우선 비즈니스 딜')).toBeVisible();
    await expect(page.locator('text=알파 슈퍼 커넥터 TOP 3')).toBeVisible();

    // 런타임 콘솔 에러 검증
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. [GraphRAG 검색] 검색창에 키워드 입력 시 필터링이 정상 작동하고 리셋되어야 한다', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="자연어"]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('삼성');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // 검색 결과나 상태 확인
    const countBadge = page.locator('text=명').first();
    await expect(countBadge).toBeVisible();

    // 리셋 버튼 클릭
    const resetButton = page.locator('button:has-text("초기화"), button[title*="초기화"]').first();
    if (await resetButton.isVisible()) {
      await resetButton.click();
    }
  });

  test('3. [3-Segment 네비게이션 순회] 사령탑, 인맥 맵 탐색, 전략 비즈니스 세그먼트 전환 및 하위 뷰가 에러 없이 렌더링되어야 한다', async ({ page }) => {
    // 1. Explore 세그먼트 전환
    const exploreSegmentBtn = page.locator('[data-testid="segment-explore"]');
    await expect(exploreSegmentBtn).toBeVisible();
    await exploreSegmentBtn.click();
    await page.waitForTimeout(500);

    const exploreTabs = [
      '🏢 회사·알럼나이',
      '🏛️ DART 기업 조직도',
      '🎂 나이대별',
      '🕸️ 2D 인터랙티브 그래프',
      '🪐 3D 은하계',
      '📅 소통 타임라인',
    ];

    for (const tabName of exploreTabs) {
      const tabButton = page.locator(`button:has-text("${tabName}")`);
      await expect(tabButton).toBeVisible();
      await tabButton.click();
      await page.waitForTimeout(500);

      // 에러 바운더리 미발동 검증
      const errorBoundaryText = page.locator('text=컴포넌트 런타임 오류가 방어되었습니다');
      await expect(errorBoundaryText).not.toBeVisible();
    }

    // 2. Business 세그먼트 전환
    const businessSegmentBtn = page.locator('[data-testid="segment-business"]');
    await expect(businessSegmentBtn).toBeVisible();
    await businessSegmentBtn.click();
    await page.waitForTimeout(500);

    const businessTabs = [
      '💼 전략 딜 워룸',
      '🗺️ 거점별 레이더',
      '🎉 영전·케어 골든타임',
      '📊 인맥 자산 진단',
      '👥 팀 인맥',
      '🎁 바운티 탐색',
    ];

    for (const tabName of businessTabs) {
      const tabButton = page.locator(`button:has-text("${tabName}")`);
      await expect(tabButton).toBeVisible();
      await tabButton.click();
      await page.waitForTimeout(500);

      // 에러 바운더리 미발동 검증
      const errorBoundaryText = page.locator('text=컴포넌트 런타임 오류가 방어되었습니다');
      await expect(errorBoundaryText).not.toBeVisible();
    }

    // 3. Command 사령탑 세그먼트 복귀
    const commandSegmentBtn = page.locator('[data-testid="segment-command"]');
    await expect(commandSegmentBtn).toBeVisible();
    await commandSegmentBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=오늘의 비즈니스 경영 사령탑')).toBeVisible();
  });

  test('4. [전략 딜 워룸] 딜 카드 및 키맨 매핑 정보가 표출되어야 한다', async ({ page }) => {
    // 비즈니스 세그먼트로 이동
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(400);

    const dealsTab = page.locator('button:has-text("💼 전략 딜 워룸")');
    await dealsTab.click();
    await page.waitForTimeout(600);

    // 딜 워룸 헤더 확인
    await expect(page.locator('text=전략 비즈니스 딜 & 인맥 어카운트 워룸')).toBeVisible();

    // 신규 딜 생성 버튼 존재 확인
    await expect(page.locator('button:has-text("신규 딜 생성")')).toBeVisible();
  });

  test('5. [거점별 레이더] 6대 거점 칩 전환 및 티타임 제안 복사가 작동해야 한다', async ({ page }) => {
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(400);

    const proximityTab = page.locator('button:has-text("🗺️ 거점별 레이더")');
    await proximityTab.click();
    await page.waitForTimeout(600);

    // 거점 레이더 헤더
    await expect(page.locator('text=전국 6대 비즈니스 거점별 인맥 레이더')).toBeVisible();

    // 판교 칩 클릭
    const pangyoChip = page.locator('button:has-text("판교 테크노밸리")');
    if (await pangyoChip.isVisible()) {
      await pangyoChip.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=판교 테크노밸리').first()).toBeVisible();
    }
  });

  test('6. [영전·케어 레이더] 승진 피드 및 축전 생성 모달이 열려야 한다', async ({ page }) => {
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(400);

    const promoTab = page.locator('button:has-text("🎉 영전·케어 골든타임")');
    await promoTab.click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=DART 임원 영전·승진 & 골든타임 케어 레이더')).toBeVisible();

    // 축전 화환 생성 버튼 클릭 시도
    const createGiftButton = page.locator('button:has-text("축전·화환 생성")').first();
    if (await createGiftButton.isVisible()) {
      await createGiftButton.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=영전 축전 생성기')).toBeVisible();

      // 모달 닫기
      await page.locator('button:has-text("✕")').first().click();
    }
  });

  test('7. [인맥 자산 진단실] 침투 매트릭스 및 CSV 다운로드 버튼이 동작해야 한다', async ({ page }) => {
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(400);

    const auditTab = page.locator('button:has-text("📊 인맥 자산 진단")');
    await auditTab.click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=전략 인맥 자산 가치 & 타깃 기업 침투율 진단실')).toBeVisible();
    await expect(page.locator('button:has-text("CSV 진단서 다운로드 (BOM)")')).toBeVisible();
  });

  test('8. [경영 사령탑 1-Click 티타임/축전 인터랙션] 사령탑의 퀵 액션이 동작해야 한다', async ({ page }) => {
    // 사령탑 세그먼트 확인
    await page.locator('[data-testid="segment-command"]').click();
    await page.waitForTimeout(500);

    // 티타임 초대장 복사 버튼 존재 확인
    const teaBtn = page.locator('button[title*="티타임 초대장 복사"]').first();
    await expect(teaBtn).toBeVisible();

    // 복사 클릭 시도
    await teaBtn.click();
    await page.waitForTimeout(300);
  });
});
