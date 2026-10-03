import { test, expect } from '@playwright/test';

test.describe('일반 실무 인재 중심: 실무 인재 시너지 & 성장 스튜디오 (Peer Synergy Hub) E2E 검증', () => {
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

  test('1. 일반 회원 뷰 상단 액션 바에서 실무 시너지 허브 호출 및 4대 탭 완결 루프 검증', async ({ page }) => {
    // 1. 일반 회원 뷰 상단 [실무 시너지 허브] 버튼 클릭
    const openBtn = page.locator('[data-testid="open-peer-synergy-btn"]');
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    // 2. 모달 팝업 및 헤더 확인
    const modal = page.locator('[data-testid="peer-synergy-hub-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=실무 인재 시너지 & 성장 스튜디오')).toBeVisible();

    // ==========================================
    // TAB 1: 테크 스택 랜드스케이프
    // ==========================================
    const techTab = page.locator('[data-testid="tab-synergy-tech"]');
    await expect(techTab).toBeVisible();
    await expect(modal.locator('text=React 19 & Next.js App Router').first()).toBeVisible();

    // 기술 자문 서신 복사 클릭
    const copyAdviceBtn = modal.locator('button:has-text("기술 자문 서신 복사")').first();
    await expect(copyAdviceBtn).toBeVisible();
    await copyAdviceBtn.click();
    await expect(modal.locator('text=서신 복사됨!').first()).toBeVisible({ timeout: 5000 });

    // ==========================================
    // TAB 2: 따뜻한 사내 채용 추천
    // ==========================================
    const referralTab = page.locator('[data-testid="tab-synergy-referral"]');
    await referralTab.click();
    await expect(modal.locator('text=헤드헌팅 스팸 제로!').first()).toBeVisible();
    await expect(modal.locator('text=토스 (비바리퍼블리카)').first()).toBeVisible();

    // 서신 유형 전환 (2. 사내추천 부탁)
    const askTab = modal.locator('button:has-text("2. 사내추천 부탁")');
    await askTab.click();

    // 맞춤 서신 복사 클릭
    const copyReferralBtn = modal.locator('[data-testid="copy-warm-referral-btn"]');
    await expect(copyReferralBtn).toBeVisible();
    await copyReferralBtn.click();
    await expect(modal.locator('text=복사 완료!').first()).toBeVisible({ timeout: 5000 });

    // ==========================================
    // TAB 3: 스터디 & 사이드 길드
    // ==========================================
    const guildTab = page.locator('[data-testid="tab-synergy-guild"]');
    await guildTab.click();
    await expect(modal.locator('text=Next.js 15 & AI Agent 풀스택 토이 프로젝트 팟').first()).toBeVisible();

    // 팟 참여 신청 클릭 -> '참여 취소'로 상태 전이 확인
    const joinBtn = modal.locator('button:has-text("팟 참여 신청")').first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();
    await expect(modal.locator('button:has-text("참여 취소")').first()).toBeVisible();

    // 제안서 복사 버튼 확인
    const copyProposalBtn = modal.locator('button[title*="공유용 제안서 복사"]').first();
    await expect(copyProposalBtn).toBeVisible();
    await copyProposalBtn.click();

    // ==========================================
    // TAB 4: 커피챗 인사이트 노트 볼트
    // ==========================================
    const notesTab = page.locator('[data-testid="tab-synergy-notes"]');
    await notesTab.click();
    await expect(modal.locator('text=실무 커피챗 인사이트 & 상호 회고 노트 볼트').first()).toBeVisible();

    // 기존 노트의 감사 피드백 서신 복사 확인
    const copyGratitudeBtn = modal.locator('button:has-text("감사 피드백 서신 복사")').first();
    await expect(copyGratitudeBtn).toBeVisible();
    await copyGratitudeBtn.click();
    await expect(modal.locator('text=감사 카드 복사됨!').first()).toBeVisible({ timeout: 5000 });

    // 모달 닫기 (ESC)
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('2. 커맨드 팔레트(Ctrl+K)에서 테크 스택 랜드스케이프 액션으로 즉시 모달 열기 검증', async ({ page }) => {
    // 커맨드 팔레트 단축키 (Ctrl+K) 누르기
    await page.keyboard.press('Control+KeyK');

    const palette = page.locator('[data-testid="global-command-palette"]');
    await expect(palette).toBeVisible({ timeout: 5000 });

    // 테크 스택 액션 클릭
    const techAction = palette.locator('text=내 인맥의 실무 테크 스택 랜드스케이프');
    await expect(techAction).toBeVisible({ timeout: 5000 });
    await techAction.click();

    // 실무 시너지 허브 모달이 테크 스택 탭으로 열렸는지 확인
    const modal = page.locator('[data-testid="peer-synergy-hub-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=테크 스택 랜드스케이프')).toBeVisible();

    // 닫기
    const closeBtn = modal.locator('button[title="닫기 (ESC)"]');
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
