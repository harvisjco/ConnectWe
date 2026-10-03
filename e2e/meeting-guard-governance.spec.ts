import { test, expect } from '@playwright/test';

test.describe('C-Level 거버넌스 & 미팅 가드 스튜디오 (Corporate Governance & Meeting Guard Studio) E2E 검증', () => {
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

  test('1. 일반 회원 뷰 상단 액션 바에서 거버넌스 & 미팅 가드 스튜디오 호출 및 4대 탭 완결 루프 검증', async ({ page }) => {
    // 1. 일반 회원 뷰 상단 [거버넌스 & 미팅 가드] 버튼 클릭
    const openBtn = page.locator('[data-testid="open-meeting-guard-governance-btn"]');
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    // 2. 모달 팝업 및 헤더 확인
    const modal = page.locator('[data-testid="meeting-guard-governance-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=C-Level 거버넌스 & 미팅 가드 스튜디오')).toBeVisible();

    // ==========================================
    // TAB 1: 이사회 거버넌스 & 주총 의결권
    // ==========================================
    const govTab = page.locator('[data-testid="tab-governance"]');
    await expect(govTab).toBeVisible();
    await expect(modal.locator('text=사외이사 겸직 현황 & 상법 규제 사전 검증')).toBeVisible();
    await expect(modal.locator('[data-testid="mandate-card-0"]')).toBeVisible();
    await expect(modal.locator('text=정기 주주총회 주요 의안 팩트체크')).toBeVisible();

    // ==========================================
    // TAB 2: 핵심 인재 스카우팅 & 탤런트 풀
    // ==========================================
    const talentTab = page.locator('[data-testid="tab-talent"]');
    await talentTab.click();
    await expect(modal.locator('[data-testid="talent-card-0"]')).toBeVisible();

    // 비공개 초대장 복사 클릭
    const copyInviteBtn = modal.locator('[data-testid^="copy-confidential-invite-btn-"]').first();
    await expect(copyInviteBtn).toBeVisible();
    await copyInviteBtn.click();
    await expect(modal.locator('text=복사 완료')).toBeVisible({ timeout: 3000 });

    // ==========================================
    // TAB 3: 초고속 오프라인 & CRDT 볼트
    // ==========================================
    const offlineTab = page.locator('[data-testid="tab-offline"]');
    await offlineTab.click();
    await expect(modal.locator('text=오프라인 캐시 프로필')).toBeVisible();
    await expect(modal.locator('text=양방향 무손실 동기화')).toBeVisible();

    // 수동 동기화 실행
    const syncBtn = modal.locator('[data-testid="trigger-sync-btn"]');
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // ==========================================
    // TAB 4: 미팅 가드 & 3분 팔로업
    // ==========================================
    const followupTab = page.locator('[data-testid="tab-followup"]');
    await followupTab.click();
    await expect(modal.locator('text=미팅 24시간 전 & 2시간 전 결례 없는 정중 에티켓 리마인더')).toBeVisible();
    await expect(modal.locator('text=미팅 직후 3분 감사 서신')).toBeVisible();

    // 24시간 전 리마인더 복사
    const copy24hBtn = modal.locator('[data-testid="copy-reminder-24h-btn"]');
    await expect(copy24hBtn).toBeVisible();
    await copy24hBtn.click();

    // 약속 이행 체크리스트 토글
    const commitmentItem = modal.locator('[data-testid="commitment-item-0"]');
    await expect(commitmentItem).toBeVisible();
    await commitmentItem.click();

    // 감사 서신 복사
    const copyThanksBtn = modal.locator('[data-testid="copy-thankyou-btn"]');
    await expect(copyThanksBtn).toBeVisible();
    await copyThanksBtn.click();

    // 닫기 버튼 클릭하여 정상 닫힘 확인
    const closeBtn = modal.locator('[data-testid="close-governance-modal-btn"]');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
