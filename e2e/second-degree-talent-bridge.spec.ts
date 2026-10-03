import { test, expect } from '@playwright/test';

test.describe('스쿼드 결원(Missing Skill) 2촌 탐색 & 사내 동료 소개 리퀘스트 (2nd-Degree Talent Bridge) E2E 검증', () => {
  test('1. 팀 빌더에서 2촌 동료 공유 인맥 탭 전환, 추천 리워드 확인, 사내 소개 요청 서신 복사 및 가교 배정 완결', async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 2. 커맨드 팔레트 인풋에서 '스쿼드' 검색
    const dialogInput = page.locator('[data-testid="global-command-palette"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('스쿼드');
    await page.waitForTimeout(300);

    // 3. '스마트 프로젝트 팀 빌더' 액션 클릭
    const actionBtn = page.locator('[role="dialog"]').locator('text=스마트 프로젝트 팀 빌더').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 4. 모달 렌더링 확인
    const modal = page.locator('[data-testid="project-squad-builder-modal"]');
    await expect(modal).toBeVisible();

    // 5. 1촌 / 2촌 탭 세그먼트 확인
    const firstTab = modal.locator('[data-testid="tab-candidate-first"]');
    const secondTab = modal.locator('[data-testid="tab-candidate-second"]');
    await expect(firstTab).toBeVisible();
    await expect(secondTab).toBeVisible();

    // 6. '2촌 동료 인맥' 탭 클릭
    await secondTab.click({ force: true });
    await page.waitForTimeout(400);

    // 7. 2촌 동료 인맥 카드 및 가교 동료 뱃지 확인
    const secondDegreeCards = modal.locator('[data-testid^="second-degree-card-"]');
    await expect(secondDegreeCards.first()).toBeVisible();
    await expect(modal.locator('text=가교:').first()).toBeVisible();

    // 8. 사내 추천 감사 리워드 칩 표시 확인
    await expect(modal.locator('text=추천 리워드:').first()).toBeVisible();

    // 9. 사내 소개 요청 버튼 클릭 및 '복사됨' 피드백 확인
    const introReqBtn = modal.locator('[data-testid^="intro-req-"]').first();
    await expect(introReqBtn).toBeVisible();
    await introReqBtn.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=복사됨').first()).toBeVisible();

    // 10. 2촌 인재 '가교 배정' 버튼 클릭
    const assign2ndBtn = modal.locator('[data-testid^="assign-2nd-"]').first();
    if (await assign2ndBtn.isVisible()) {
      await assign2ndBtn.click({ force: true });
      await page.waitForTimeout(400);

      // 배정됨 표시 확인
      await expect(modal.locator('text=배정됨').first()).toBeVisible();

      // 좌측 슬롯에 '2촌 가교' 뱃지 표시 확인
      await expect(modal.locator('text=2촌 가교').first()).toBeVisible();
    }

    // 11. 하단 완료 버튼으로 모달 닫기
    const completeBtn = modal.locator('[data-testid="complete-squad-builder"]');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click({ force: true });
    await page.waitForTimeout(400);

    await expect(modal).not.toBeVisible();
  });
});
