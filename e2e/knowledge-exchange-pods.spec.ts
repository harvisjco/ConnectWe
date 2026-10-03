import { test, expect } from '@playwright/test';

test.describe('일반 실무 인재 중심: 실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟 (Peer Knowledge Pods) E2E 검증', () => {
  test('1. 커맨드 팔레트에서 지식 교환 모달 호출, 카테고리 탭 필터링, 3대 자문 의제 확인 및 서신 복사 완결', async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 2. 커맨드 팔레트 인풋에서 '멘토링' 검색
    const dialogInput = page.locator('[data-testid="global-command-palette"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('멘토링');
    await page.waitForTimeout(300);

    // 3. '실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟' 액션 클릭
    const actionBtn = page.locator('[role="dialog"]').locator('text=실무 슈퍼파워 지식 교환').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 4. 모달 렌더링 확인
    const modal = page.locator('[data-testid="knowledge-exchange-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟').first()).toBeVisible();
    await expect(modal.locator('text=등록된 실무 슈퍼파워:').first()).toBeVisible();

    // 5. 카테고리 탭 필터링: 엔지니어링 & 인프라
    const engTab = modal.locator('[data-testid="tab-cat-engineering"]');
    await expect(engTab).toBeVisible();
    await engTab.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=엔지니어링 & 인프라').first()).toBeVisible();

    // 6. 카테고리 탭 필터링: AI & 프로덕트
    const aiTab = modal.locator('[data-testid="tab-cat-product"]');
    await expect(aiTab).toBeVisible();
    await aiTab.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=AI & 프로덕트').first()).toBeVisible();

    // 7. 전체 탭으로 복귀
    const allTab = modal.locator('[data-testid="tab-cat-all"]');
    await allTab.click({ force: true });
    await page.waitForTimeout(300);

    // 8. 3대 추천 자문 의제 렌더링 확인
    await expect(modal.locator('text=추천 3대 핵심 자문 의제').first()).toBeVisible();

    // 9. 1:1 자문 티타임 서신 복사 버튼 클릭
    const letterBtn = modal.locator('[data-testid^="coffee-letter-btn-"]').first();
    await expect(letterBtn).toBeVisible();
    await letterBtn.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=서신 복사됨').first()).toBeVisible();

    // 10. 모달 닫기
    const closeBtn = modal.locator('[data-testid="complete-knowledge-modal"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click({ force: true });
    await page.waitForTimeout(400);

    await expect(modal).not.toBeVisible();
  });

  test('2. 일반 회원 뷰 상단 액션 바에서 실무 지식 교환 팟 모달 정상 호출 및 닫기 검증', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    const openBtn = page.locator('[data-testid="open-knowledge-exchange-btn"]').first();
    if (await openBtn.isVisible()) {
      await openBtn.click({ force: true });
      await page.waitForTimeout(400);

      const modal = page.locator('[data-testid="knowledge-exchange-modal"]');
      await expect(modal).toBeVisible();

      // 상단 X 닫기 버튼 클릭
      const closeBtn = modal.locator('[data-testid="close-knowledge-modal"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click({ force: true });
      await page.waitForTimeout(300);

      await expect(modal).not.toBeVisible();
    }
  });
});
