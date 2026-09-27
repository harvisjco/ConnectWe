import { describe, it, expect } from 'vitest';
import { simulateExtractCardTextFromImage, parseBusinessCardText } from '../cardOcrParser';

describe('cardOcrParser - 다양한 명함 폼팩터(리멤버 벤치마크 5대 유형) 파싱 검증', () => {
  // 1. 기본 가상 명함 (박서준 CTO)
  it('[기본 명함] 가상 명함 파일(nextvision_business_card.jpg) OCR 추출 및 파싱 검증', async () => {
    const mockFile = new File(['mock content'], 'nextvision_business_card.jpg', { type: 'image/jpeg' });
    const rawText = await simulateExtractCardTextFromImage(mockFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('박서준');
    expect(parsed.currentCompany).toBe('넥스트비전 AI');
    expect(parsed.mobile).toBe('010-3849-2910');
    expect(parsed.email).toBe('seojun.park@nextvision.ai');
    expect(parsed.currentTitle).toMatch(/(최고기술책임자|CTO|전무이사)/);
    expect(parsed.primaryDomain).toBe('AI/LLM');
  });

  // 2. 유형 1: 리멤버 표준 세로형 명함 (부서-이름-직책 세로 분리 및 영문명 병기)
  it('[유형 1: 세로형 명함] 리멤버 표준 세로형 명함에서 부서, 성명, 영문명, 유선/모바일 번호를 분리 파싱해야 한다', async () => {
    const verticalFile = new File(['mock content'], 'remember_vertical_kakaomobility.jpg', { type: 'image/jpeg' });
    const rawText = await simulateExtractCardTextFromImage(verticalFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('홍길동');
    expect(parsed.englishName).toBe('Michael Hong');
    expect(parsed.currentCompany).toBe('카카오모빌리티');
    expect(parsed.currentDepartment).toBe('기술기획팀');
    expect(parsed.currentTitle).toBe('이사');
    expect(parsed.mobile).toBe('010-5541-9872');
    expect(parsed.tel).toBe('02-6900-1234');
    expect(parsed.email).toBe('michael.hong@kakaomobility.com');
    expect(parsed.primaryDomain).toBe('모빌리티');
  });

  // 3. 유형 2: 글로벌 스타트업 영문 혼용형 명함 (+82 포맷, Head of AI & Co-founder 직책)
  it('[유형 2: 글로벌 스타트업] 영문 직책(Head of AI & Co-founder)과 +82 휴대폰 번호를 정규화 파싱해야 한다', async () => {
    const startupFile = new File(['mock content'], 'global_startup_deepmind.png', { type: 'image/png' });
    const rawText = await simulateExtractCardTextFromImage(startupFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('이예진');
    expect(parsed.englishName).toBe('Yejin Lee');
    expect(parsed.currentCompany).toContain('DeepMind Labs');
    expect(parsed.currentTitle).toMatch(/(Head of AI|Co-founder)/);
    expect(parsed.mobile).toBe('010-9876-5432');
    expect(parsed.email).toBe('yejin.lee@deepmindlabs.ai');
    expect(parsed.primaryDomain).toBe('AI/LLM');
  });

  // 4. 유형 3: 대기업/금융/지주사 3중 연락처 분리형 명함 (Tel, Mobile, Fax 동시 존재)
  it('[유형 3: 대기업/금융권] 유선전화(Tel), 휴대전화(Mobile), 팩스(Fax)를 오인 없이 각각 분리 파싱해야 한다', async () => {
    const financeFile = new File(['mock content'], 'mirae_asset_finance.jpg', { type: 'image/jpeg' });
    const rawText = await simulateExtractCardTextFromImage(financeFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('김진우');
    expect(parsed.currentCompany).toBe('미래에셋벤처투자');
    expect(parsed.currentDepartment).toBe('글로벌투자본부');
    expect(parsed.currentTitle).toBe('수석심사역');
    expect(parsed.mobile).toBe('010-7762-1190');
    expect(parsed.tel).toBe('02-3774-1000');
    expect(parsed.fax).toBe('02-3774-1099');
    expect(parsed.email).toBe('jinwoo.kim@miraeasset.com');
    expect(parsed.primaryDomain).toBe('투자/VC');
  });

  // 5. 유형 4: 전문직/로펌 파트너 명함 (파트너 변호사, Direct 유선번호)
  it('[유형 4: 로펌/전문직] 파트너 변호사 직책, M&A팀, 직통전화(Direct)를 정밀 파싱해야 한다', async () => {
    const lawFile = new File(['mock content'], 'bkl_law_partner.png', { type: 'image/png' });
    const rawText = await simulateExtractCardTextFromImage(lawFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('최민호');
    expect(parsed.currentCompany).toBe('태평양');
    expect(parsed.currentTitle).toMatch(/(파트너 변호사|변호사)/);
    expect(parsed.currentDepartment).toBe('M&A팀');
    expect(parsed.tel).toBe('02-3404-0610');
    expect(parsed.mobile).toBe('010-2345-6789');
    expect(parsed.email).toBe('minho.choi@bkl.co.kr');
    expect(parsed.primaryDomain).toBe('법률/컴플라이언스');
  });

  // 6. 유형 5: 라벨형 (Key: Value) 명함
  it('[유형 5: 라벨형 명함] Name:, Company:, Title: 콜론 라벨이 붙은 명함을 정확하게 파싱해야 한다', async () => {
    const labelFile = new File(['mock content'], 'label_form_card.jpg', { type: 'image/jpeg' });
    const rawText = await simulateExtractCardTextFromImage(labelFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('강태오');
    expect(parsed.currentCompany).toBe('엔비젼테크');
    expect(parsed.currentDepartment).toBe('클라우드플랫폼사업부');
    expect(parsed.currentTitle).toBe('상무이사');
    expect(parsed.mobile).toBe('010-4432-8871');
    expect(parsed.tel).toBe('02-555-8800');
    expect(parsed.email).toBe('teo.kang@envisiontech.io');
    expect(parsed.address).toContain('테헤란로 218');
  });

  // 7. 일반 폴백 및 엣지 케이스 안정성
  it('[폴백 안정성] 비표준 텍스트 또는 일반 파일도 충돌(Crash) 없이 우아하게 기본 파싱되어야 한다', async () => {
    const fallbackFile = new File(['mock content'], 'general_card.png', { type: 'image/png' });
    const rawText = await simulateExtractCardTextFromImage(fallbackFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('김도현');
    expect(parsed.currentCompany).toBe('하이퍼네트웍스');
    expect(parsed.mobile).toBe('010-8923-4512');
    expect(parsed.email).toBe('dohyun.kim@hypernetworks.ai');
    expect(parsed.currentDepartment).toBe('AI Lab 대규모언어모델팀');
  });
});
