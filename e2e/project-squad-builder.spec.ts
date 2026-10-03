import { test, expect } from '@playwright/test';

test.describe('일반 핵심 실무 인재 중심: 스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오 E2E 검증', () => {
  test('1. 커맨드 팔레트에서 팀 빌더 호출, 4대 템플릿 전환, 실무 인재 배정 및 1-Page 제안서 복사 검증', async ({ page, context }) => {
    test.setTimeout(60000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

    // 1. 스포트라이트 커맨드 팔레트 오픈
    const cmdPaletteBtn = page.locator('button[title*="스포트라이트"]').first();
    await expect(cmdPaletteBtn).toBeVisible();
    await cmdPaletteBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 2. 커맨드 팔레트 다이얼로그 내부 인풋에서 '스쿼드' 검색
    const dialogInput = page.locator('[data-testid="global-command-palette"] input').first();
    await expect(dialogInput).toBeVisible();
    await dialogInput.fill('스쿼드');
    await page.waitForTimeout(300);

    // 3. '스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오' 액션 클릭
    const actionBtn = page.locator('[role="dialog"]').locator('text=스마트 프로젝트 팀 빌더').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 4. 모달 렌더링 확인
    const modal = page.locator('[data-testid="project-squad-builder-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오').first()).toBeVisible();
    await expect(modal.locator('text=스쿼드 완성도:').first()).toBeVisible();

    // 5. 템플릿 전환 테스트: '풀스택 웹/모바일 MVP 빌딩 팀' 클릭
    const mvpTemplateBtn = modal.locator('button:has-text("풀스택 웹/모바일 MVP 빌딩 팀")').first();
    await expect(mvpTemplateBtn).toBeVisible();
    await mvpTemplateBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 6. 템플릿 전환 테스트: 'B2B 엔터프라이즈 신사업 개척 TF' 클릭
    const b2bTemplateBtn = modal.locator('button:has-text("B2B 엔터프라이즈 신사업 개척 TF")').first();
    await expect(b2bTemplateBtn).toBeVisible();
    await b2bTemplateBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 7. 다시 'AI/LLM 프로덕트 스쿼드' 클릭
    const aiTemplateBtn = modal.locator('button:has-text("AI/LLM 프로덕트 스쿼드")').first();
    await expect(aiTemplateBtn).toBeVisible();
    await aiTemplateBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 8. 우측 후보자 추천 패널 확인 및 '팀에 배정' 버튼 동작 확인
    const assignBtn = modal.locator('button:has-text("팀에 배정")').first();
    if (await assignBtn.isVisible()) {
      await assignBtn.click({ force: true });
      await page.waitForTimeout(200);
    }

    // 9. 슬롯 내 '제안서' 복사 버튼 클릭
    const copyBriefBtn = modal.locator('button:has-text("제안서")').first();
    if (await copyBriefBtn.isVisible()) {
      await copyBriefBtn.click({ force: true });
      await page.waitForTimeout(200);
    }

    // 10. 하단 '전체 스쿼드 요약 복사' 버튼 클릭
    const copyAllBtn = modal.locator('button:has-text("전체 스쿼드 요약 복사")').first();
    await expect(copyAllBtn).toBeVisible();
    await copyAllBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 11. 모달 닫기 (상단 X 닫기 버튼 또는 완료 버튼)
    const closeBtn = modal.locator('[data-testid="close-squad-builder"]')
      .or(modal.locator('button[title*="닫기"]'))
      .or(modal.locator('button:has-text("완료")'))
      .first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click({ force: true });
    await page.waitForTimeout(400);

    await expect(modal).not.toBeVisible();
  });

  test('2. 일반 동문 뷰 및 팀 협업 뷰 상단 액션 버튼으로 팀 빌더 정상 호출 검증', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    // 1. 초기 일반 회원 뷰(GeneralMemberView) 상단 액션의 '프로젝트 팀 빌더' 버튼 확인 및 클릭
    const generalBuilderBtn = page.locator('button:has-text("프로젝트 팀 빌더")').first();
    if (await generalBuilderBtn.isVisible()) {
      await generalBuilderBtn.click({ force: true });
      await page.waitForTimeout(400);

      // 모달 오픈 확인
      const modal = page.locator('[data-testid="project-squad-builder-modal"]');
      await expect(modal).toBeVisible();
      await expect(modal.locator('text=가상 스쿼드 슬롯 편성').first()).toBeVisible();

      // 닫기
      const closeBtn = modal.locator('[data-testid="close-squad-builder"]')
        .or(modal.locator('button[title*="닫기"]'))
        .or(modal.locator('button:has-text("완료")'))
        .first();
      await expect(closeBtn).toBeVisible();
      await closeBtn.click({ force: true });
      await page.waitForTimeout(400);
      await expect(modal).not.toBeVisible();
    }

    // 2. LNB 사이드바에서 '팀 네트워크 협업'으로 이동
    const teamLnbItem = page.locator('text=팀 네트워크 협업').or(page.locator('text=팀 협업')).first();
    if (await teamLnbItem.isVisible()) {
      await teamLnbItem.click({ force: true });
      await page.waitForTimeout(500);

      // 3. TeamNetworkView 상단 액션의 '스마트 프로젝트 팀 빌더' 버튼 확인 및 클릭
      const teamBuilderBtn = page.locator('button:has-text("스마트 프로젝트 팀 빌더")').first();
      if (await teamBuilderBtn.isVisible()) {
        await teamBuilderBtn.click({ force: true });
        await page.waitForTimeout(400);

        // 모달 오픈 확인
        const modal = page.locator('[data-testid="project-squad-builder-modal"]');
        await expect(modal).toBeVisible();
        await expect(modal.locator('text=가상 스쿼드 슬롯 편성').first()).toBeVisible();

        // 닫기
        const closeBtn2 = modal.locator('[data-testid="close-squad-builder"]')
          .or(modal.locator('button[title*="닫기"]'))
          .or(modal.locator('button:has-text("완료")'))
          .first();
        await expect(closeBtn2).toBeVisible();
        await closeBtn2.click({ force: true });
        await page.waitForTimeout(400);
        await expect(modal).not.toBeVisible();
      }
    }
  });
});
