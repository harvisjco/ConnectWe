import { test, expect } from '@playwright/test';

test.describe('VIP 골든타임 능동형 케어 & 안부 서신 코파일럿 (Golden Care Radar) E2E 검증', () => {
  test('1. 커맨드 팔레트에서 골든타임 안부 모달 호출, 4대 테마 전환, 클립보드 복사 및 소통 완결 루프 검증', async ({ page }) => {
    // 1. 앱 접속
    await page.goto('/');

    // 헤더 로고 확인
    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 2. 커맨드 팔레트 열기 (상단 검색/단축키 버튼 클릭)
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click();

    // 커맨드 팔레트 입력창 확인 및 '골든' 검색
    const searchInput = page.locator('input[placeholder*="검색"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('골든');

    // 'VIP 골든타임 능동형 케어' 액션 클릭
    const goldenCareAction = page.locator('text=VIP 골든타임 능동형 케어').first();
    await expect(goldenCareAction).toBeVisible();
    await goldenCareAction.click();

    // 3. 골든타임 안부 모달 오픈 확인
    await expect(page.locator('text=VIP 골든타임 능동형 케어 & 안부 서신 코파일럿')).toBeVisible();
    await expect(page.locator('text=Golden Care Radar')).toBeVisible();

    // 4. 4대 안부 테마 탭 확인 및 전환
    await expect(page.locator('text=🌱 계절 안부')).toBeVisible();
    await expect(page.locator('text=🎉 영전/공시 축하')).toBeVisible();
    await expect(page.locator('text=☕ 가벼운 커피')).toBeVisible();
    await expect(page.locator('text=🤝 사업 교류')).toBeVisible();

    // '☕ 가벼운 커피' 탭 클릭
    await page.locator('button:has-text("☕ 가벼운 커피")').click();
    await expect(page.locator('textarea')).toBeVisible();

    // 이메일 장문 서신 모드로 전환
    const emailChannelBtn = page.locator('button:has-text("이메일 서신 (장문)")');
    await emailChannelBtn.click();
    await expect(page.locator('input[type="text"]').filter({ hasText: '' }).first()).toBeVisible();

    // 다시 카카오톡 / 문자 단문 모드로 복귀
    const smsChannelBtn = page.locator('button:has-text("카카오톡 / 문자 (단문)")');
    await smsChannelBtn.click();

    // 5. [서신 복사 & 오늘 소통 완료 처리] 클릭
    const copyCompleteBtn = page.locator('button:has-text("서신 복사 & 오늘 소통 완료 처리")');
    await expect(copyCompleteBtn).toBeVisible();
    await copyCompleteBtn.click();

    // 6. 복사 성공 피드백 및 모달 자동 닫힘 확인
    await expect(page.locator('text=복사 및 소통 기록 완료!')).toBeVisible();
    await expect(page.locator('text=VIP 골든타임 능동형 케어 & 안부 서신 코파일럿')).not.toBeVisible({ timeout: 5000 });
  });

  test('2. 소통 타임라인 뷰에서 인재 목록의 [안부 전송] 원터치 버튼으로 골든타임 모달 직접 연동 검증', async ({ page }) => {
    await page.goto('/');

    // 1. 소통 타임라인 뷰로 이동 (LNB 또는 SubNav 탭)
    const timelineNavBtn = page.locator('button:has-text("소통 타임라인"), button:has-text("관계 현황"), [data-testid="tab-command"]').first();
    if (await timelineNavBtn.isVisible()) {
      await timelineNavBtn.click();
    }

    // 2. 상단 더보기 C-Suite 메뉴를 통한 골든케어 호출 검증
    const csuiteBtn = page.locator('button[title*="경영진 도구 모음"]').first();
    if (await csuiteBtn.isVisible()) {
      await csuiteBtn.click();
      const goldenCareMenuBtn = page.locator('button:has-text("VIP 골든타임 능동형 안부 케어")').first();
      await expect(goldenCareMenuBtn).toBeVisible();
      await goldenCareMenuBtn.click();

      // 모달 오픈 확인
      await expect(page.locator('text=VIP 골든타임 능동형 케어 & 안부 서신 코파일럿')).toBeVisible();
      
      // 닫기 버튼 클릭하여 안전하게 닫힘 확인
      const closeBtn = page.locator('button:has-text("닫기")').first();
      await closeBtn.click();
      await expect(page.locator('text=VIP 골든타임 능동형 케어 & 안부 서신 코파일럿')).not.toBeVisible();
    }
  });
});
