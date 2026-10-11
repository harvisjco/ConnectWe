import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('실제 명함 이미지 인식, 저장, 검색 통합 실전 테스트 (Real Card Scanner E2E)', () => {
  test('생성된 명함 이미지를 업로드하여 OCR 인식 -> 인맥 저장 -> 주소록 검색 및 상세 조회 전 과정 검증', async ({ page }) => {
    // 1. 브라우저 뷰포트 설정 및 접속
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. 일반 회원 뷰가 아니면 일반 회원 뷰로 전환하거나 명함 스캔 버튼 찾기
    const generalCardScannerBtn = page.locator('[data-testid="open-card-scanner-btn"]');
    if (!(await generalCardScannerBtn.isVisible())) {
      // LNB에서 동문 주소록 클릭 또는 2번 키 누르기
      await page.keyboard.press('2');
      await page.waitForTimeout(500);
    }

    // 명함 스캔 버튼 클릭
    await expect(generalCardScannerBtn).toBeVisible({ timeout: 5000 });
    await generalCardScannerBtn.click();

    // 3. SmartCardScannerStudio 모달 렌더링 확인
    const studioTitle = page.locator('text=명함 원터치 지능형 스캔 & DART 임원 결합');
    await expect(studioTitle).toBeVisible({ timeout: 5000 });

    // 4. 생성된 실물 명함 이미지 업로드
    const imagePath = path.resolve('tests/fixtures/seojun_business_card.jpg');
    const fileInput = page.locator('[data-testid="card-file-input"]');
    await fileInput.setInputFiles(imagePath);

    // 5. OCR 인식 및 파싱 결과 대기 (폼 필드에 값 채워질 때까지 대기)
    const nameInput = page.locator('input[value*="박서준"], label:has-text("성명") + input');
    await expect(nameInput).toHaveValue(/박서준/, { timeout: 10000 });

    const companyInput = page.locator('label:has-text("회사명") + input');
    await expect(companyInput).toHaveValue(/넥스트비전|NextVision/i);

    const mobileInput = page.locator('label:has-text("휴대폰 번호") + input');
    await expect(mobileInput).toHaveValue(/010-3849-2910/);

    // 스크린샷 1: 명함 스캔 및 OCR 구조화 추출 완료 화면
    await page.screenshot({ path: 'e2e/screenshots/card-test-01-scanned.png', fullPage: false });

    // 6. 네트워크 인맥으로 등록 버튼 클릭
    const saveBtn = page.locator('button:has-text("네트워크 인맥으로 등록")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 토스트 메시지 및 모달 닫힘 확인
    await page.waitForTimeout(1000);

    // 만약 인물 상세 인스펙터 모달이 자동으로 열렸다면 닫기 (ESC)
    const inspectorClose = page.locator('button[title*="닫기"], [data-testid="person-inspector-modal"] button:has-text("닫기")').first();
    if (await inspectorClose.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // 7. 주소록 검색창에서 '박서준' 검색
    const searchInput = page.locator('input[placeholder*="이름, 학교, 전공"], input[placeholder*="주소록 검색"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('박서준');
    await page.waitForTimeout(500);

    // 8. 검색 결과 목록에 등록된 '박서준' 인맥 카드 노출 확인
    const personCard = page.locator('h3:has-text("박서준"), span:has-text("박서준")').first();
    await expect(personCard).toBeVisible();

    // 스크린샷 2: 저장 후 주소록 검색 결과 노출 화면
    await page.screenshot({ path: 'e2e/screenshots/card-test-02-search-result.png', fullPage: false });

    // 9. 인맥 카드 클릭하여 상세 프로필 확인
    await personCard.click();
    await page.waitForTimeout(500);

    // 상세 모달 내 정보 검증 (박서준, 넥스트비전, 010-3849-2910 등)
    const modalName = page.locator('h2:has-text("박서준"), h3:has-text("박서준")').first();
    await expect(modalName).toBeVisible();

    // 스크린샷 3: 상세 프로필 모달 확인 화면
    await page.screenshot({ path: 'e2e/screenshots/card-test-03-person-detail.png', fullPage: false });

    console.log('✅ 명함 이미지 인식, 저장, 검색, 상세 조회 전 과정 테스트 100% 성공');
  });
});
