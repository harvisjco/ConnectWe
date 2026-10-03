import { test, expect } from '@playwright/test';

test.describe('일반 실무 인재 중심: 실무 인재 신뢰 & 커리어 도약 스튜디오 (Peer Trust & Career Studio) E2E 검증', () => {
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

  test('1. 일반 회원 뷰 상단 액션 바에서 신뢰 & 커리어 스튜디오 호출 및 4대 탭 완결 루프 검증', async ({ page }) => {
    // 1. 일반 회원 뷰 상단 [신뢰 & 커리어 스튜디오] 버튼 클릭
    const openBtn = page.locator('[data-testid="open-peer-trust-career-btn"]');
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    // 2. 모달 팝업 및 헤더 확인
    const modal = page.locator('[data-testid="peer-trust-career-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=실무 인재 신뢰 & 커리어 도약 스튜디오')).toBeVisible();

    // ==========================================
    // TAB 1: 피어 실무 보증 & 신뢰 뱃지
    // ==========================================
    const endorseTab = page.locator('[data-testid="tab-peer-endorsements"]');
    await expect(endorseTab).toBeVisible();
    await expect(modal.locator('text=김지원 님의 실무 신뢰 현황').first()).toBeVisible();
    await expect(modal.locator('text=동료 공인 실무 인재 (Verified)').first()).toBeVisible();

    // 새 실무 보증 남기기 폼 열기 및 닫기
    const newEndorseBtn = modal.locator('button:has-text("새 실무 보증 남기기")');
    await expect(newEndorseBtn).toBeVisible();
    await newEndorseBtn.click();
    await expect(modal.locator('text=소중한 동료에게 실무 보증 남기기')).toBeVisible();
    await modal.locator('button:has-text("취소")').first().click();

    // 감사 커피 서신 복사 클릭
    const copyThankYouBtn = modal.locator('button:has-text("감사 커피 서신 복사")').first();
    await expect(copyThankYouBtn).toBeVisible();
    await copyThankYouBtn.click();

    // ==========================================
    // TAB 2: 디지털 실무 명함 (vCard & QR)
    // ==========================================
    const digitalCardTab = page.locator('[data-testid="tab-peer-digital-card"]');
    await digitalCardTab.click();
    await expect(modal.locator('text=김성우').first()).toBeVisible();
    await expect(modal.locator('text=프론트엔드 & AI 테크 리드').first()).toBeVisible();
    await expect(modal.locator('text=RFC 6350 Certified').first()).toBeVisible();

    // 개인정보 마스킹 토글 클릭
    const maskBtn = modal.locator('button:has-text("전체 정보 표시"), button:has-text("개인정보 마스킹 켜짐")').first();
    await expect(maskBtn).toBeVisible();
    await maskBtn.click();

    // .vcf 다운로드 버튼 확인
    const downloadVCardBtn = modal.locator('button:has-text(".vcf 다운로드")');
    await expect(downloadVCardBtn).toBeVisible();

    // ==========================================
    // TAB 3: 크로스 직무 커피챗 룰렛
    // ==========================================
    const rouletteTab = page.locator('[data-testid="tab-peer-roulette"]');
    await rouletteTab.click();
    await expect(modal.locator('text=크로스 직무 1:1 캐주얼 커피챗 룰렛')).toBeVisible();
    await expect(modal.locator('text=어색함 없는 3대 아이스브레이킹 대화 카드')).toBeVisible();

    // 룰렛 돌리기 버튼 클릭
    const spinBtn = modal.locator('button:has-text("룰렛 돌리기")');
    await expect(spinBtn).toBeVisible();
    await spinBtn.click();
    await page.waitForTimeout(800); // 스핀 애니메이션 대기

    // 초대 서신 복사 클릭
    const copyInviteBtn = modal.locator('button:has-text("초대 서신 복사")');
    await expect(copyInviteBtn).toBeVisible();
    await copyInviteBtn.click();

    // ==========================================
    // TAB 4: 커리어 패스 & 스킬 갭 멘토
    // ==========================================
    const careerTab = page.locator('[data-testid="tab-peer-career-path"]');
    await careerTab.click();
    await expect(modal.locator('text=목표 도달 준비도')).toBeVisible();
    await expect(modal.locator('text=부족 역량 자문 가능한 1촌/2촌 실무 멘토')).toBeVisible();

    // 멘토 조언 요청 서신 복사 클릭
    const copyMentorBtn = modal.locator('button:has-text("조언 요청 서신 복사")').first();
    await expect(copyMentorBtn).toBeVisible();
    await copyMentorBtn.click();

    // 닫기 버튼 클릭하여 모달 정상 종료 확인
    const closeBtn = modal.locator('button:has-text("닫기")').last();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
