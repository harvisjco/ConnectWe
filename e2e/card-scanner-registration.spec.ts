import { test, expect } from '@playwright/test';
import path from 'path';

test('가상 명함 이미지 업로드 및 신규 인맥 등록 전체 플로우 검증', async ({ page }) => {
  // 1. 앱 접속
  await page.goto('/');

  // 헤더 로고 확인
  await expect(page.getByRole('heading', { name: 'ConnectWe' })).toBeVisible();

  // 2. [명함 스캔 등록] 버튼 클릭
  const cardScanButton = page.locator('button:has-text("명함 스캔 등록")').first();
  await expect(cardScanButton).toBeVisible();
  await cardScanButton.click();

  // 3. 명함 스캔 모달 확인
  await expect(page.locator('text=명함 원터치 지능형 스캔')).toBeVisible();

  // 4. 가상 생성된 명함 이미지 업로드 (data-testid 타겟팅)
  const filePath = path.resolve('public/test-assets/nextvision_business_card.jpg');
  const fileInput = page.locator('[data-testid="card-file-input"]');
  await fileInput.setInputFiles(filePath);

  // 5. OCR 파싱 결과 확인 (이름: 박서준, 회사: 주식회사 넥스트비전 AI 폼 입력 확인)
  await expect(page.locator('input[value="박서준"]').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('input[value="넥스트비전 AI"]').first()).toBeVisible();

  // 6. [네트워크 인맥으로 등록] 버튼 클릭
  const submitButton = page.locator('button:has-text("네트워크 인맥으로 등록")');
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // 7. 모달 닫힘 및 주소록에 '박서준' 신규 인맥 카드 노출 확인
  await expect(page.locator('text=명함 원터치 지능형 스캔')).not.toBeVisible();
  await expect(page.locator('text=박서준').first()).toBeVisible();
  await expect(page.locator('text=넥스트비전').first()).toBeVisible();
});
