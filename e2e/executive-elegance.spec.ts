import { test, expect } from '@playwright/test';

test.describe('비즈니스 품격 & 글로벌 쇼케이스 스튜디오 (Executive Elegance Studio) E2E 검증', () => {
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

  test('1. 일반 회원 뷰 상단 액션 바에서 비즈니스 품격 스튜디오 호출 및 4대 탭 완결 루프 검증', async ({ page }) => {
    // 1. 일반 회원 뷰 상단 [품격 & 쇼케이스 스튜디오] 버튼 클릭
    const openBtn = page.locator('[data-testid="open-executive-elegance-btn"]');
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    // 2. 모달 팝업 및 헤더 확인
    const modal = page.locator('[data-testid="executive-elegance-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=비즈니스 품격 & 글로벌 쇼케이스 스튜디오')).toBeVisible();

    // ==========================================
    // TAB 1: 비즈니스 티타임 조율기 & .ICS
    // ==========================================
    const schedulerTab = page.locator('[data-testid="tab-scheduler"]');
    await expect(schedulerTab).toBeVisible();
    await expect(modal.locator('text=조용하고 품격 있는 추천 비즈니스 라운지 거점')).toBeVisible();
    await expect(modal.locator('text=상대방의 일정을 배려한 3대 추천 시간대')).toBeVisible();

    // 판교 라운지 카드 클릭
    const pangyoCard = modal.locator('[data-testid="location-card-pangyo"]');
    await expect(pangyoCard).toBeVisible();
    await pangyoCard.click();

    // 티타임 제안 서신 복사 클릭
    const copyProposalBtn = modal.locator('[data-testid="copy-proposal-btn"]');
    await expect(copyProposalBtn).toBeVisible();
    await copyProposalBtn.click();
    await expect(modal.locator('text=복사 완료!')).toBeVisible({ timeout: 3000 });

    // ==========================================
    // TAB 2: 글로벌 출장 & 인맥 레이더
    // ==========================================
    const tripTab = page.locator('[data-testid="tab-trip"]');
    await tripTab.click();
    await expect(modal.locator('text=출장 및 외근 목적지 거점 선택')).toBeVisible();
    await expect(modal.locator('text=현지 조우(Reunion) 추천 인맥')).toBeVisible();

    // 도쿄 거점 선택
    const tokyoBtn = modal.locator('[data-testid="city-cluster-btn-tokyo"]');
    await expect(tokyoBtn).toBeVisible();
    await tokyoBtn.click();

    // 첫 번째 조우 서신 복사 클릭
    const copyReunionBtn = modal.locator('[data-testid^="copy-reunion-letter-btn-"]').first();
    await expect(copyReunionBtn).toBeVisible();
    await copyReunionBtn.click();

    // ==========================================
    // TAB 3: 소소한 감동 메모 캡슐 & 스몰톡 큐카드
    // ==========================================
    const memoryTab = page.locator('[data-testid="tab-memory"]');
    await memoryTab.click();
    await expect(modal.locator('text=소소한 감동 메모 캡슐')).toBeVisible();
    await expect(modal.locator('text=미팅 5분 전 어색함 없는 4대 스몰톡 큐카드')).toBeVisible();
    await expect(modal.locator('[data-testid="cue-card-coffee"]')).toBeVisible();

    // 커피 큐카드 복사 클릭
    const copyCueBtn = modal.locator('[data-testid="copy-cue-btn-coffee"]');
    await expect(copyCueBtn).toBeVisible();
    await copyCueBtn.click();

    // ==========================================
    // TAB 4: 내 프로덕트 쇼케이스 & 검증
    // ==========================================
    const showcaseTab = page.locator('[data-testid="tab-showcase"]');
    await showcaseTab.click();
    await expect(modal.locator('text=실전 검증 프로덕트 & 아키텍처 쇼케이스')).toBeVisible();
    await expect(modal.locator('[data-testid^="showcase-card-"]').first()).toBeVisible();

    // 동료 실전 검증 응원 클릭
    const endorseBtn = modal.locator('[data-testid="endorse-btn"]');
    await expect(endorseBtn).toBeVisible();
    await endorseBtn.click();

    // 1-Page 브리프 복사 클릭
    const copyBriefBtn = modal.locator('[data-testid="copy-portfolio-brief-btn"]');
    await expect(copyBriefBtn).toBeVisible();
    await copyBriefBtn.click();
    await expect(modal.locator('text=복사 완료')).toBeVisible({ timeout: 3000 });

    // 닫기 버튼 클릭하여 정상 닫힘 확인
    const closeBtn = modal.locator('[data-testid="close-modal-btn"]');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
