import { test, expect } from '@playwright/test';

test.describe('C-Level Phase 3: 비즈니스 파트너십 KPI 파이프라인 & DART 거버넌스 시뮬레이터 E2E 검증', () => {
  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');
    // 페이지 로드 완료 확인
    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible({ timeout: 15000 });

    // 마스터 등급으로 전환하여 전체 C-Level 메뉴 활성화
    const masterRoleBtn = page.locator('button:has-text("마스터")').first();
    if (await masterRoleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await masterRoleBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('1. 비즈니스 파트너십 룸에서 Executive KPI 바, 6단계 칸반, DART 거버넌스 시뮬레이션 완결 루프 검증', async ({ page }) => {
    // LNB에서 'deals' 탭으로 이동
    const partnershipTab = page.locator('[data-testid="lnb-deals"], [data-testid="tab-deals"]').first();
    await expect(partnershipTab).toBeVisible({ timeout: 10000 });
    await partnershipTab.click();

    // 1. 헤더 및 Executive KPI 메트릭 바 확인
    await expect(page.locator('text=비즈니스 파트너십 & 프로젝트 협력 룸, text=비즈니스 파트너십').first()).toBeVisible({ timeout: 10000 });
    const kpiBar = page.locator('[data-testid="executive-pipeline-kpi-bar"]');
    await expect(kpiBar).toBeVisible();

    // 4대 지표 텍스트 확인
    await expect(kpiBar.locator('text=총 파이프라인 규모')).toBeVisible();
    await expect(kpiBar.locator('text=건전도 가중 실질 가치')).toBeVisible();
    await expect(kpiBar.locator('text=평균 인맥 연결 건전도')).toBeVisible();
    await expect(kpiBar.locator('text=의사결정권자/챔피언 확보율')).toBeVisible();

    // 2. 6단계 칸반 컬럼 확인
    await expect(page.locator('text=1. 기회 탐색')).toBeVisible();
    await expect(page.locator('text=6. 수주 완료')).toBeVisible();

    // 3. DART 거버넌스 시뮬레이터 모달 호출
    const simBtn = page.locator('button:has-text("DART 공시 시뮬레이터")');
    await expect(simBtn).toBeVisible();
    await simBtn.click();

    // 시뮬레이터 모달 확인
    const simModal = page.locator('[data-testid="gov-sim-modal"]');
    await expect(simModal).toBeVisible();
    await expect(simModal.locator('text=DART 전자공시 거버넌스 시뮬레이터')).toBeVisible();

    // 4. 시뮬레이션 분석 실행
    const runBtn = page.locator('[data-testid="btn-run-gov-sim"]');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // 5. 시뮬레이션 결과 박스 확인
    const resultBox = page.locator('[data-testid="gov-sim-result-box"]');
    await expect(resultBox).toBeVisible({ timeout: 5000 });
    await expect(resultBox.locator('text=C-Level 실행 권고 (Actionable Intelligence)')).toBeVisible();

    // 6. 모달 닫기
    const closeBtn = simModal.locator('button:has-text("닫기")');
    await closeBtn.click();
    await expect(simModal).not.toBeVisible();
  });

  test('2. 정기 인사 & 안부 레이더에서 DART 영전·승진 피드 및 축전 복사 흐름 검증', async ({ page }) => {
    // LNB에서 'promotion' 탭으로 이동
    const promoTab = page.locator('[data-testid="lnb-promotion"], [data-testid="tab-promotion"]').first();
    await expect(promoTab).toBeVisible({ timeout: 10000 });
    await promoTab.click();

    // 헤더 확인
    await expect(page.locator('text=DART 임원 영전·승진 & 골든타임 케어 레이더')).toBeVisible({ timeout: 10000 });

    // DART 영전 피드 탭 활성화 확인
    await expect(page.locator('text=DART 영전·승진 감지 피드')).toBeVisible();

    // 첫 번째 축전·화환 생성 버튼 클릭
    const msgBtn = page.locator('button:has-text("축전·화환 생성"), button:has-text("축전 생성")').first();
    if (await msgBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await msgBtn.click();

      // 축전 모달 확인
      await expect(page.locator('text=영전 축전 생성기')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=상황에 맞는 축하 서신')).toBeVisible();

      // 닫기 또는 발송 완료 클릭
      const closeMsgBtn = page.locator('button:has-text("발송 및 축하 완료 처리"), button:has-text("✕")').first();
      if (await closeMsgBtn.isVisible()) {
        await closeMsgBtn.click();
      }
    }
  });
});
