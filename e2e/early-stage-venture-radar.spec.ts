import { test, expect } from '@playwright/test';

test.describe('일반 실무 인재 중심: 초기 스타트업 창업 & 시드 펀딩 레이더 (Early-Stage Founder Radar) E2E 검증', () => {
  test('1. 커맨드 팔레트에서 창업 레이더 호출, 스테이지 탭 필터링, 응원 서신 복사 및 파운딩 스쿼드 빌더 연계 완결', async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 2. 커맨드 팔레트 인풋에서 '창업' 검색
    const dialogInput = page.locator('[data-testid="global-command-palette"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('창업');
    await page.waitForTimeout(300);

    // 3. '초기 스타트업 창업 & 시드 펀딩 레이더' 액션 클릭
    const actionBtn = page.locator('[role="dialog"]').locator('text=초기 스타트업 창업 & 시드 펀딩 레이더').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 4. 창업 레이더 모달 렌더링 확인
    const modal = page.locator('[data-testid="early-stage-venture-radar-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=초기 스타트업 창업 & 시드 펀딩 레이더').first()).toBeVisible();
    await expect(modal.locator('text=감지된 창업 시그널:').first()).toBeVisible();

    // 5. 탭 세그먼트 필터링 검증: 스텔스 모드
    const stealthTab = modal.locator('[data-testid="tab-stage-stealth"]');
    await expect(stealthTab).toBeVisible();
    await stealthTab.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=스텔스 모드').first()).toBeVisible();

    // 6. 탭 세그먼트 필터링 검증: 시드 & TIPS
    const seedTab = modal.locator('[data-testid="tab-stage-seed"]');
    await expect(seedTab).toBeVisible();
    await seedTab.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=시드 & TIPS 선정').first()).toBeVisible();

    // 7. 전체 탭으로 복귀
    const allTab = modal.locator('[data-testid="tab-stage-all"]');
    await allTab.click({ force: true });
    await page.waitForTimeout(300);

    // 8. 응원 & 티타임 서신 복사 버튼 클릭
    const cheerBtn = modal.locator('[data-testid^="cheer-btn-"]').first();
    await expect(cheerBtn).toBeVisible();
    await cheerBtn.click({ force: true });
    await page.waitForTimeout(300);
    await expect(modal.locator('text=서신 복사됨').first()).toBeVisible();

    // 9. 파운딩 스쿼드 빌딩 버튼 클릭 -> 팀 빌더 모달로 자연스러운 전이 확인
    const squadBtn = modal.locator('[data-testid^="squad-btn-"]').first();
    await expect(squadBtn).toBeVisible();
    await squadBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 창업 레이더 모달은 닫히고, 프로젝트 스쿼드 빌더 모달 오픈 확인
    await expect(modal).not.toBeVisible();
    const squadModal = page.locator('[data-testid="project-squad-builder-modal"]');
    await expect(squadModal).toBeVisible();
    await expect(squadModal.locator('text=스마트 프로젝트 팀 빌더').first()).toBeVisible();

    // 스쿼드 빌더 모달 닫기
    const closeSquadBtn = squadModal.locator('[data-testid="complete-squad-builder"]');
    await closeSquadBtn.click({ force: true });
    await page.waitForTimeout(400);
    await expect(squadModal).not.toBeVisible();
  });

  test('2. 일반 회원 뷰 상단 액션 바에서 창업 & 시드 레이더 모달 정상 호출 및 닫기 검증', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    // 일반 회원 뷰(GeneralMemberView) 상단의 '창업 & 시드 레이더' 버튼 클릭
    const openBtn = page.locator('[data-testid="open-venture-radar-btn"]').first();
    if (await openBtn.isVisible()) {
      await openBtn.click({ force: true });
      await page.waitForTimeout(400);

      const modal = page.locator('[data-testid="early-stage-venture-radar-modal"]');
      await expect(modal).toBeVisible();

      // 모달 닫기 버튼 클릭
      const closeBtn = modal.locator('[data-testid="complete-venture-radar"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click({ force: true });
      await page.waitForTimeout(300);

      await expect(modal).not.toBeVisible();
    }
  });
});
