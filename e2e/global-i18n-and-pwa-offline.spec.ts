import { test, expect } from '@playwright/test';

test.describe('C-Level Phase 4: 글로벌 다국어(KO/EN/JA), PWA 오프라인 안심 동기화 & WebAuthn 생체인증 E2E 검증', () => {
  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 헤더 타이틀 로드 확인
    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible({ timeout: 15000 });
  });

  test('1. 글로벌 언어 스위처(KO -> EN -> JA -> KO) 순환 전환 및 실시간 번역 동기화 검증', async ({ page }) => {
    const langBtn = page.locator('[data-testid="language-switcher"]');
    await expect(langBtn).toBeVisible({ timeout: 10000 });

    // 초기 상태 KO 확인
    const initialText = await langBtn.innerText();
    expect(initialText).toContain('KO');

    // 1회 클릭: KO -> EN
    await langBtn.click();
    await page.waitForTimeout(500);
    await expect(langBtn).toContainText('EN');

    // 2회 클릭: EN -> JA
    await langBtn.click();
    await page.waitForTimeout(500);
    await expect(langBtn).toContainText('JA');

    // 3회 클릭: JA -> KO 복귀
    await langBtn.click();
    await page.waitForTimeout(500);
    await expect(langBtn).toContainText('KO');
  });

  test('2. PWA 오프라인 안심 동기화 뱃지 클릭 및 수동 동기화 팝오버 검증', async ({ page }) => {
    const offlineBadgeBtn = page.locator('[data-testid="offline-badge-btn"]');
    await expect(offlineBadgeBtn).toBeVisible({ timeout: 10000 });

    // 동기화 뱃지 클릭하여 팝오버 열기
    await offlineBadgeBtn.click();
    await page.waitForTimeout(300);

    // 팝오버 내부 타이틀 및 안내 확인
    await expect(page.locator('text=네트워크 & 데이터 안심 동기화')).toBeVisible();
    await expect(page.locator('text=클라우드와 완벽 동기화됨')).toBeVisible();

    // '지금 수동 동기화' 버튼 클릭
    const syncNowBtn = page.locator('button:has-text("지금 수동 동기화")');
    await expect(syncNowBtn).toBeVisible();
    await syncNowBtn.click();
    await page.waitForTimeout(500);
  });

  test('3. AuthModal에서 WebAuthn 생체인증(Touch ID / Face ID) 1초 퀵 로그인 완결 검증', async ({ page }) => {
    // 비로그인 상태일 때 헤더의 '로그인' 버튼 클릭
    const loginHeaderBtn = page.locator('button:has-text("로그인")').first();
    if (await loginHeaderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginHeaderBtn.click();
    } else {
      // 이미 로그인되어 있으면 프로필 메뉴 열어서 로그아웃 후 다시 열기
      const userMenuTrigger = page.locator('button[title*="로그인 계정"]').first();
      if (await userMenuTrigger.isVisible()) {
        await userMenuTrigger.click();
        const logoutBtn = page.locator('button:has-text("로그아웃")').first();
        if (await logoutBtn.isVisible()) {
          await logoutBtn.click();
          await page.waitForTimeout(500);
          await loginHeaderBtn.click();
        }
      }
    }

    // AuthModal 다이얼로그 확인
    const authDialog = page.locator('role=dialog');
    await expect(authDialog).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=경영진 안전 인증 센터')).toBeVisible();

    // WebAuthn 생체인증 퀵 로그인 버튼 확인
    const bioBtn = page.locator('[data-testid="btn-biometric-quick-login"]');
    await expect(bioBtn).toBeVisible();
    await expect(bioBtn).toContainText('Touch ID / Face ID 1초 퀵 로그인');

    // 생체인증 버튼 클릭하여 퀵 로그인 실행
    await bioBtn.click();
    await page.waitForTimeout(1000);

    // 모달이 닫히고 헤더에 사용자 프로필 및 '격리됨' 뱃지 노출 확인
    await expect(authDialog).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=격리됨').first()).toBeVisible({ timeout: 5000 });
  });
});
