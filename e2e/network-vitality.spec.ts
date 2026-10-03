import { test, expect } from '@playwright/test';

test.describe('일반 실무 인재 중심: 네트워크 생명력 & 밋업·글로벌 스튜디오 (Network Vitality Studio) E2E 검증', () => {
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

  test('1. 일반 회원 뷰 상단 액션 바에서 네트워크 생명력 스튜디오 호출 및 4대 탭 완결 루프 검증', async ({ page }) => {
    // 1. 일반 회원 뷰 상단 [관계 생명력 & 밋업 룸] 버튼 클릭
    const openBtn = page.locator('[data-testid="open-network-vitality-btn"]');
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    // 2. 모달 팝업 및 헤더 확인
    const modal = page.locator('[data-testid="network-vitality-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=네트워크 생명력 & 밋업·글로벌 스튜디오')).toBeVisible();

    // ==========================================
    // TAB 1: 관계 생명력 & 안부 레이더
    // ==========================================
    const radarTab = page.locator('[data-testid="tab-vitality-radar"]');
    await expect(radarTab).toBeVisible();
    await expect(modal.locator('text=내 인맥 네트워크 건강 지수')).toBeVisible();
    await expect(modal.locator('text=어색함 없는 시즌 맞춤 서신 템플릿')).toBeVisible();

    // 안부 서신 복사 클릭
    const copyGreetingBtn = modal.locator('button:has-text("안부 서신 복사")').first();
    await expect(copyGreetingBtn).toBeVisible();
    await copyGreetingBtn.click();

    // ==========================================
    // TAB 2: 현장 밋업 & 컨퍼런스 룸
    // ==========================================
    const meetupTab = page.locator('[data-testid="tab-vitality-meetup"]');
    await meetupTab.click();
    await expect(modal.locator('text=2026 판교 테크 & 프로덕트 리더스 밋업')).toBeVisible();
    await expect(modal.locator('text=현재 현장 참여자')).toBeVisible();

    // 참석자 일괄 감사 서신 복사 클릭
    const copyBroadcastBtn = modal.locator('button:has-text("참석자 일괄 감사 서신")');
    await expect(copyBroadcastBtn).toBeVisible();
    await copyBroadcastBtn.click();

    // ==========================================
    // TAB 3: 글로벌 바이링구얼 미팅
    // ==========================================
    const bilingualTab = page.locator('[data-testid="tab-vitality-bilingual"]');
    await bilingualTab.click();
    await expect(modal.locator('text=Bilingual Intelligence')).toBeVisible();
    await expect(modal.locator('text=국문 C-Level 핵심 합의 사항 & 사양')).toBeVisible();
    await expect(modal.locator('text=글로벌 표준 에티켓 영문 팔로업 서신')).toBeVisible();

    // 영문 서신 복사 클릭
    const copyEmailBtn = modal.locator('button:has-text("영문 서신 복사")');
    await expect(copyEmailBtn).toBeVisible();
    await copyEmailBtn.click();

    // ==========================================
    // TAB 4: 실무 난제 SOS 헬프데스크
    // ==========================================
    const sosTab = page.locator('[data-testid="tab-vitality-sos"]');
    await sosTab.click();
    await expect(modal.locator('text=크로스 컴퍼니 실무 난제 SOS 헬프데스크')).toBeVisible();
    await expect(modal.locator('text=AWS EKS 대규모 트래픽 시 Ingress 타임아웃')).toBeVisible();

    // 15분 자문 서신 복사 클릭
    const copyAdviceBtn = modal.locator('button:has-text("15분 자문 서신")').first();
    await expect(copyAdviceBtn).toBeVisible();
    await copyAdviceBtn.click();

    // 닫기 버튼 클릭하여 정상 닫힘 확인
    const closeBtn = modal.locator('button:has-text("닫기")').last();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
