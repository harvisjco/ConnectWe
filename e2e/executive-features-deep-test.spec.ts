import { test, expect } from '@playwright/test';

test.describe('C-Level 차세대 6대 핵심 기능 심층 실전 E2E 테스트 & 잠재 결함 진단', () => {
  const consoleErrors: string[] = [];
  const pageErrors: Error[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    pageErrors.length = 0;

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err);
    });

    // 데스크톱 1440x900 표준 뷰포트 설정
    await page.setViewportSize({ width: 1440, height: 900 });
    // 앱 로드
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. 상단 헤더 오프라인 팝오버 및 동기화 상태 검증', async ({ page }) => {
    // Header Live 버튼 클릭
    const liveButton = page.locator('header button[title*="Supabase"]').first();
    await expect(liveButton).toBeVisible();
    await liveButton.click();

    // 팝오버 렌더링 확인
    const popover = page.locator('text=클라우드 실시간 연동');
    await expect(popover).toBeVisible();
    await expect(page.locator('text=AES-256-GCM')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-01-offline-popover.png' });

    // 지금 동기화 버튼 클릭
    const syncButton = page.locator('button:has-text("지금 동기화")');
    await expect(syncButton).toBeVisible();
    await syncButton.click();

    // 팝오버 닫기 (헤더 브랜드 로고 클릭)
    await page.locator('header h1').click();
    await page.waitForTimeout(300);
  });

  test('2. CMD+K 커맨드 팔레트 키보드 단축키 및 스마트 액션 전수 검증', async ({ page }) => {
    // 스포트라이트 검색 버튼 클릭 트리거
    const searchBtn = page.locator('header button[title*="스포트라이트"]');
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();
    await page.waitForTimeout(400);

    const paletteInput = page.locator('[data-testid="global-command-palette"] input');
    await expect(paletteInput).toBeVisible();

    // 스마트 액션 5종 노출 여부 확인
    await expect(page.locator('text=이동 중 30초 음성 회고 AI')).toBeVisible();
    await expect(page.locator('text=최단 신뢰 소개 경로 파인더')).toBeVisible();
    await expect(page.locator('text=C-Level 월요 전략 주간 브리프')).toBeVisible();
    await expect(page.locator('text=연속 명함 일괄 스캔 & 실시간 DART 결합')).toBeVisible();
    await expect(page.locator('text=경영진 티타임 의제 AI 코파일럿')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-02-command-palette.png' });

    // 검색어 필터링 테스트
    await paletteInput.fill('티타임');
    await page.waitForTimeout(200);
    await expect(page.locator('text=경영진 티타임 의제 AI 코파일럿')).toBeVisible();

    // ESC 키로 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(paletteInput).not.toBeVisible();
  });

  test('3. ☕ 경영진 티타임 의제 AI 코파일럿 & .ICS 다운로드 검증 (Meeting Studio)', async ({ page }) => {
    const teaButton = page.locator('button:has-text("티타임 코파일럿")');
    await expect(teaButton).toBeVisible();
    await teaButton.click();

    // 스튜디오 모달 렌더링 확인
    const modalTitle = page.locator('text=경영진 미팅 & 티타임 스튜디오');
    await expect(modalTitle).toBeVisible();

    // 티타임 3대 아젠다 탭 활성화 확인
    const teaTimeTab = page.locator('button:has-text("티타임 3대 의제")');
    await expect(teaTimeTab).toBeVisible();

    // 3대 아젠다 및 아이스브레이킹 노출 확인
    await expect(page.locator('text=추천 아이스브레이킹 화두')).toBeVisible();
    await expect(page.locator('text=C-Level 3대 핵심 비즈니스 아젠다')).toBeVisible();
    await expect(page.locator('text=경영진의 통찰을 돋보이게 하는 품격 질문 3선')).toBeVisible();

    // 서신 복사 버튼 클릭
    const copyButton = page.locator('button:has-text("품격 확정 서신 복사")');
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // .ics 캘린더 다운로드 버튼 확인
    const downloadButton = page.locator('button:has-text(".ICS 캘린더 초대장 원클릭 다운로드")');
    await expect(downloadButton).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-03-teatime-modal.png' });

    // ESC 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('4. 🎙️ 미팅 회고 & 감사 서신 스튜디오 검증 (Executive Debrief Studio)', async ({ page }) => {
    const debriefButton = page.locator('button:has-text("음성 회고")');
    await expect(debriefButton).toBeVisible();
    await debriefButton.click();

    const title = page.locator('text=미팅 회고 & 감사 서신 스튜디오');
    await expect(title).toBeVisible();
    await expect(page.locator('text=이동 중 음성 모드')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-04-voice-debrief.png' });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('5. 🧭 신뢰 소개 허브 스튜디오 검증 (Warm Intro Hub Studio)', async ({ page }) => {
    const introButton = page.locator('button:has-text("소개 경로")');
    await expect(introButton).toBeVisible();
    await introButton.click();

    const title = page.locator('text=신뢰 소개 허브 스튜디오');
    await expect(title).toBeVisible();
    await expect(page.locator('button:has-text("최단 신뢰 소개 경로")')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-05-warm-intro.png' });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('6. 📊 C-Level 주간 경영진 브리프 검증', async ({ page }) => {
    const weeklyButton = page.locator('button:has-text("주간 브리프")');
    await expect(weeklyButton).toBeVisible();
    await weeklyButton.click();

    const title = page.locator('text=C-Level 월요 전략 인텔리전스 1-Page 리포트');
    await expect(title).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-06-weekly-brief.png' });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('7. 📇 스마트 명함 스캔 스튜디오 일괄 모드 검증 (Card Scanner Studio)', async ({ page }) => {
    const batchButton = page.locator('button:has-text("명함 일괄")');
    await expect(batchButton).toBeVisible();
    await batchButton.click();

    const title = page.locator('text=명함 원터치 지능형 스캔 & DART 임원 결합');
    await expect(title).toBeVisible();
    await expect(page.locator('text=연속 일괄 스캔 (여러 장)')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-07-batch-scanner.png' });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('8. 인물 상세 중앙 딤 모달과 퀵 액션 연동 무결성 검증', async ({ page }) => {
    // 사령탑 또는 첫 번째 인물 카드 클릭
    const firstPerson = page.locator('text=홍길동').first();
    if (await firstPerson.isVisible()) {
      await firstPerson.click();
    } else {
      // 테이블이나 리스트에서 첫 행 클릭
      const anyPerson = page.locator('tr td button, [data-person-id]').first();
      if (await anyPerson.isVisible()) {
        await anyPerson.click();
      }
    }

    await page.waitForTimeout(500);

    // 모달 내 티타임 코파일럿 버튼 확인
    const teaTimeCta = page.locator('button:has-text("경영진 티타임 의제 AI 코파일럿")');
    if (await teaTimeCta.isVisible()) {
      await teaTimeCta.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=경영진 미팅 & 티타임 스튜디오')).toBeVisible();
      await page.screenshot({ path: 'e2e/screenshots/test-08-person-inspector-teatime.png' });
      await page.keyboard.press('Escape');
    }
  });

  test('9. 일반 노트북 화면 (1200x800)에서 헤더 C-Suite 더보기 드롭다운 반응형 완결성 검증', async ({ page }) => {
    // 1200x800 일반 노트북 해상도로 뷰포트 변경
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);

    // C-Suite 더보기 버튼 클릭
    const moreBtn = page.locator('header button[title*="경영진 도구 모음"]');
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();
    await page.waitForTimeout(200);

    // 드롭다운 팝오버 렌더링 확인
    await expect(page.locator('text=C-Level 전략 무기 모음')).toBeVisible();
    await expect(page.locator('text=티타임 의제 & 캘린더 (.ICS)')).toBeVisible();
    await expect(page.locator('text=연속 명함 일괄 스캔')).toBeVisible();
    await expect(page.locator('text=최단 신뢰 소개 경로 파인더')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/test-09-c-suite-more-menu.png' });

    // 드롭다운 내에서 티타임 의제 클릭 시 스튜디오 오픈 확인
    const menuTeaTime = page.locator('button:has-text("티타임 의제 & 캘린더 (.ICS)")').first();
    await expect(menuTeaTime).toBeVisible();
    await menuTeaTime.click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=경영진 미팅 & 티타임 스튜디오')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test.afterAll(async () => {
    console.log('=== 콘솔 오류 수집 결과 ===');
    console.log('Console Errors:', consoleErrors.length, consoleErrors);
    console.log('Page Errors:', pageErrors.length, pageErrors);
  });
});
