import { test, expect } from '@playwright/test';

test.describe('C-Level 차세대 2대 혁신: 경조사 의전 컨시어지 & 에어팟 30초 오디오 브리핑 E2E 검증', () => {
  test('1. 커맨드 팔레트에서 경조사 의전 모달 호출, 청탁금지법 가이드, 6대 경조사 탭 전환 및 서신 복사 완결 루프 검증', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    // 1. 헤더 및 브랜드 로고 렌더링 대기
    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 2. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click({ force: true });
    await page.waitForTimeout(400);

    // 3. 커맨드 팔레트 다이얼로그 내부 인풋에서 '의전' 검색
    const dialogInput = page.locator('[data-testid="global-command-palette"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('의전');
    await page.waitForTimeout(300);

    // 4. 'C-Suite 경조사 의전 컨시어지' 스마트 액션 클릭
    const protocolAction = page.locator('[role="dialog"]').locator('text=C-Suite 경조사 의전 컨시어지').first();
    await expect(protocolAction).toBeVisible();
    await protocolAction.click({ force: true });
    await page.waitForTimeout(500);

    // 5. ExecutiveProtocolModal 렌더링 확인 (.first()로 중복 strict mode 방어)
    await expect(page.locator('text=C-Suite 경조사 의전 & 정중 서신 컨시어지').first()).toBeVisible();

    // 청탁금지법 가이드라인 확인
    await expect(page.locator('text=축의·조의금').first()).toBeVisible();
    await expect(page.locator('text=화환·조화').first()).toBeVisible();
    await expect(page.locator('text=선물 한도').first()).toBeVisible();

    // 6대 경조사 탭 전환: '혼사 축의 (결혼)' 클릭
    const weddingTab = page.locator('button:has-text("혼사 축의 (결혼)")').first();
    await expect(weddingTab).toBeVisible();
    await weddingTab.click({ force: true });
    await page.waitForTimeout(300);

    // 서신 포맷 탭 전환: '화환/난 리본 축문' 클릭
    const ribbonTab = page.locator('button:has-text("화환/난 리본 축문")').first();
    await expect(ribbonTab).toBeVisible();
    await ribbonTab.click({ force: true });
    await page.waitForTimeout(300);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    const ribbonContent = await textarea.inputValue();
    expect(ribbonContent).toContain('祝 華燭의 典');

    // 서신 복사 & 의전 완료 버튼 클릭
    const copyBtn = page.locator('button:has-text("서신 복사 & 의전 완료")').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click({ force: true });

    // 완료 피드백 확인 (버튼 변경 또는 상단 토스트 알림)
    await expect(
      page.locator('text=복사 및 의전 완료!').or(page.locator('text=의전 서신이 복사되었으며')).first()
    ).toBeVisible();
  });

  test('2. 커맨드 팔레트에서 에어팟 30초 오디오 브리핑 호출, 웨이브폼/타임라인 확인 및 배속 토글 검증', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click({ force: true });
    await page.waitForTimeout(400);

    // 2. 다이얼로그 내부 인풋에서 '오디오' 검색
    const dialogInput = page.locator('[data-testid="global-command-palette"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('오디오');
    await page.waitForTimeout(300);

    // 3. '에어팟 앰비언트 30초 오디오 브리핑' 액션 클릭
    const audioAction = page.locator('text=에어팟 앰비언트 30초 오디오 브리핑').first();
    await expect(audioAction).toBeVisible();
    await audioAction.click({ force: true });
    await page.waitForTimeout(500);

    // 4. AmbientAudioBriefingModal 렌더링 확인 (.first()로 중복 strict mode 방어)
    await expect(page.locator('text=에어팟 앰비언트 30초 오디오 브리핑').first()).toBeVisible();
    await expect(page.locator('text=라디오 팟캐스트 모드').first()).toBeVisible();
    await expect(page.locator('text=3단계 라디오 브리핑 타임라인').first()).toBeVisible();

    // 5. 3단계 세그먼트 확인
    await expect(page.locator('text=1. 프로필 & DART 팩트').first()).toBeVisible();
    await expect(page.locator('text=2. 직전 소통 & 약속 이력').first()).toBeVisible();
    await expect(page.locator('text=3. 오늘 나눌 3대 핵심 화두').first()).toBeVisible();

    // 6. 배속 토글 버튼 (1.25x) 클릭
    const rate125Btn = page.locator('button:has-text("1.25x")').first();
    await expect(rate125Btn).toBeVisible();
    await rate125Btn.click({ force: true });

    // 7. 스크립트 전문 복사 버튼 클릭
    const copyScriptBtn = page.locator('button:has-text("스크립트 전문 복사")').first();
    await expect(copyScriptBtn).toBeVisible();
    await copyScriptBtn.click({ force: true });
    await expect(page.locator('text=복사됨').first()).toBeVisible();

    // 8. 모달 닫기
    const closeBtn = page.locator('button:has-text("닫기")').first();
    await closeBtn.click({ force: true });
  });
});
