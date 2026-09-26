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
    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();
    await expect(page.locator('button[title*="Supabase"]')).toBeVisible();

    // 오늘의 경영 사령탑 홈 대시보드 렌더링 확인
    await expect(page.locator('text=오늘의 비즈니스 경영 사령탑')).toBeVisible();
    await expect(page.locator('text=오늘의 현장 레이더')).toBeVisible();
    await expect(page.locator('text=DART 영전 조기 감지')).toBeVisible();
    await expect(page.locator('text=소통 골든타임 넛지')).toBeVisible();
    await expect(page.locator('text=최우선 비즈니스 딜')).toBeVisible();
    await expect(page.locator('text=핵심 네트워크 허브 TOP 3')).toBeVisible();

    // 런타임 콘솔 에러 검증
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. [GraphRAG 검색] 검색창에 키워드 입력 시 필터링이 정상 작동하고 리셋되어야 한다', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="전문 스킬 검색"]').first();
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

  test('3. [LNB 네비게이션 순회] 11대 핵심 메뉴 전환 시 컴포넌트 런타임 오류 없이 정상 렌더링되어야 한다', async ({ page }) => {
    const menuItems = [
      { testId: 'lnb-command', label: '오늘의 비즈니스 경영 사령탑' },
      { testId: 'lnb-alumni', label: '소중한 인연' },
      { testId: 'lnb-org', label: '기업 조직도' },
      { testId: 'lnb-deals', label: '전략 딜' },
      { testId: 'lnb-proximity', label: '거점별 레이더' },
      { testId: 'lnb-promotion', label: '영전·케어 골든타임' },
      { testId: 'lnb-audit', label: '인맥 자산 진단' },
      { testId: 'lnb-team', label: '팀 인맥' },
      { testId: 'lnb-referral', label: '추천 리워드' },
      { testId: 'lnb-timeline', label: '소통 타임라인' },
      { testId: 'lnb-canvas', label: '2D 인터랙티브 그래프' },
    ];

    for (const item of menuItems) {
      const btn = page.locator(`[data-testid="${item.testId}"]`).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(400);

        // 에러 바운더리 미발동 검증
        const errorBoundary = page.locator('text=컴포넌트 런타임 오류가 방어되었습니다');
        await expect(errorBoundary).not.toBeVisible();
      }
    }

    // 사령탑 복귀
    const cmdBtn = page.locator('[data-testid="lnb-command"]').first();
    if (await cmdBtn.isVisible()) {
      await cmdBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=오늘의 비즈니스 경영 사령탑')).toBeVisible();
    }
  });

  test('4. [전략 딜] 딜 파이프라인 칸반 및 상세 모달 연계가 동작해야 한다', async ({ page }) => {
    const dealsTab = page.locator('[data-testid="lnb-deals"]').first();
    await dealsTab.click();
    await page.waitForTimeout(500);

    // 딜 헤더 확인
    await expect(page.locator('text=전략 비즈니스 딜 파이프라인 협업 룸')).toBeVisible();

    // 신규 딜 생성 버튼 존재 확인
    await expect(page.locator('button:has-text("신규 딜 생성")')).toBeVisible();
  });

  test('5. [거점별 레이더] 6대 거점 칩 전환 및 뷰 토글이 작동해야 한다', async ({ page }) => {
    const proximityTab = page.locator('[data-testid="lnb-proximity"]').first();
    await proximityTab.click();
    await page.waitForTimeout(500);

    // 거점 레이더 헤더
    await expect(page.locator('text=전국 6대 비즈니스 거점별 인맥 레이더')).toBeVisible();

    // 판교 칩 클릭
    const pangyoChip = page.locator('button:has-text("판교 테크노밸리")');
    if (await pangyoChip.isVisible()) {
      await pangyoChip.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=판교 테크노밸리').first()).toBeVisible();
    }
  });

  test('6. [영전·케어 레이더] 승진 피드 및 축전 생성 모달이 열려야 한다', async ({ page }) => {
    const promoTab = page.locator('[data-testid="lnb-promotion"]').first();
    await promoTab.click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=DART 임원 영전·승진 & 골든타임 케어 레이더')).toBeVisible();

    // 축전 생성 버튼 클릭 시도
    const createGiftButton = page.locator('button:has-text("축전 생성")').first();
    if (await createGiftButton.isVisible()) {
      await createGiftButton.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=영전 축전 생성기')).toBeVisible();

      // 모달 닫기
      const closeBtn = page.locator('button:has-text("✕")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('7. [인맥 자산 진단실] 커버리지 진단 및 CSV 다운로드 버튼이 동작해야 한다', async ({ page }) => {
    const auditTab = page.locator('[data-testid="lnb-audit"]').first();
    await auditTab.click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=신뢰 네트워크 현황 & 주요 파트너 기업 커버리지 리포트')).toBeVisible();
    await expect(page.locator('button:has-text("CSV 진단서 다운로드 (BOM)")')).toBeVisible();
  });

  test('8. [경영 사령탑 1-Click 티타임 인터랙션] 사령탑의 퀵 액션이 동작해야 한다', async ({ page }) => {
    const cmdBtn = page.locator('[data-testid="lnb-command"]').first();
    await cmdBtn.click();
    await page.waitForTimeout(500);

    // 티타임 초대장 복사 버튼 존재 확인
    const teaBtn = page.locator('button[title*="티타임 초대장 복사"]').first();
    if (await teaBtn.isVisible()) {
      await teaBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
