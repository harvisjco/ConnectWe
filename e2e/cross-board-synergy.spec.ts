import { test, expect } from '@playwright/test';

test.describe('C-Level 3순위 과제: 전략적 M&A & 크로스 보드 시뮬레이터 (Cross-Board Simulator) E2E 검증', () => {
  test('1. 커맨드 팔레트에서 시너지 시뮬레이터 호출, 4대 탭 전환, 기업 변경 및 1-Page 브리프 복사 검증', async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click();
    await page.waitForTimeout(200);

    // 2. '시너지' 검색
    const dialogInput = page.locator('[role="dialog"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('시너지');
    await page.waitForTimeout(300);

    // 3. '전략적 M&A & 크로스 보드 시뮬레이터' 액션 클릭
    const actionBtn = page.locator('text=전략적 M&A & 크로스 보드 시뮬레이터').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 4. CrossBoardSynergyModal 렌더링 확인
    await expect(page.locator('text=전략적 M&A & 크로스 보드 시뮬레이터').first()).toBeVisible();
    await expect(page.locator('text=결합 시너지 지수').first()).toBeVisible();

    // 5. 탭 전환: '3대 신뢰 가교 경로' 클릭
    const routesTab = page.locator('button:has-text("3대 신뢰 가교 경로")').first();
    await expect(routesTab).toBeVisible();
    await routesTab.click({ force: true });
    await page.waitForTimeout(200);

    await expect(page.locator('text=루트 1: [C-Level 다이렉트 패스]').first()).toBeVisible();
    await expect(page.locator('text=루트 2: [알럼나이 브릿지 패스]').first()).toBeVisible();
    await expect(page.locator('text=루트 3: [투자·자문 파트너 가교]').first()).toBeVisible();

    // 6. 탭 전환: '밸류체인 결합 화두 (3)' 클릭
    const themesTab = page.locator('button:has-text("밸류체인 결합 화두 (3)")').first();
    await expect(themesTab).toBeVisible();
    await themesTab.click({ force: true });
    await page.waitForTimeout(200);

    await expect(page.locator('text=기술/R&D 시너지').first()).toBeVisible();
    await expect(page.locator('text=공급망/유통망 결합').first()).toBeVisible();
    await expect(page.locator('text=지분 제휴/M&A 기회').first()).toBeVisible();

    // 7. 탭 전환: '1-Page 전략 브리프' 클릭
    const briefTab = page.locator('button:has-text("1-Page 전략 브리프")').first();
    await expect(briefTab).toBeVisible();
    await briefTab.click({ force: true });
    await page.waitForTimeout(200);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    const briefContent = await textarea.inputValue();
    expect(briefContent).toContain('[C-Level 전략 시너지 브리프]');
    expect(briefContent).toContain('최우선 3대 신뢰 가교 경로');

    // 8. 1-Page 브리프 복사 버튼 클릭
    const copyBtn = page.locator('button:has-text("전략 브리프 복사")').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click({ force: true });

    // 9. 모달 닫기
    const closeBtn = page.locator('button:has-text("닫기")').first();
    await closeBtn.click({ force: true });
  });

  test('2. 기업 조직도 뷰에서 [크로스 보드 시너지] 원클릭 진입 검증', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 좌측 LNB에서 '기업 조직도' 또는 상단 탭에서 '기업 조직도' 클릭
    const orgChartNav = page.locator('button:has-text("기업 조직도")').first();
    await expect(orgChartNav).toBeVisible();
    await orgChartNav.click();
    await page.waitForTimeout(400);

    // 2. 상단 ViewHeader 우측에 '크로스 보드 시너지' 버튼 확인 및 클릭
    const synergyBtn = page.locator('button:has-text("크로스 보드 시너지")').first();
    await expect(synergyBtn).toBeVisible();
    await synergyBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 3. 모달 정상 마운트 확인
    await expect(page.locator('text=전략적 M&A & 크로스 보드 시뮬레이터').first()).toBeVisible();
    await expect(page.locator('text=결합 시너지 지수').first()).toBeVisible();

    // 4. 모달 닫기
    const closeBtn = page.locator('button:has-text("닫기")').first();
    await closeBtn.click({ force: true });
  });
});
