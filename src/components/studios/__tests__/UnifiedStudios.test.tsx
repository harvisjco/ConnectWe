import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SmartCardScannerStudio } from '../SmartCardScannerStudio';
import { ExecutiveMeetingStudio } from '../ExecutiveMeetingStudio';
import { ExecutiveDebriefStudio } from '../ExecutiveDebriefStudio';
import { WarmIntroHubStudio } from '../WarmIntroHubStudio';
import { DataVaultSecurityStudio } from '../DataVaultSecurityStudio';
import { Person } from '../../../types/network';

const mockPeople: Person[] = [
  {
    id: 'p-1',
    name: '김태원',
    currentCompany: '삼성전자',
    currentTitle: '부사장',
    currentDepartment: '시스템LSI 사업부',
    mobile: '010-1234-5678',
    email: 'tw.kim@samsung.com',
    primaryDomain: '반도체/AI 가속기',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    skills: ['반도체', 'AI 가속기'],
    careers: [],
    academics: [],
    connectionChannel: 'dart',
    sourceType: 'DART_FACT',
    closeness: 1,
    isStale: false,
    dartInfo: {
      corpCode: '00126380',
      stockName: '삼성전자',
      registeredRole: '사내이사',
      isPublicDirector: true,
      verifiedAt: '2026-03-15'
    }
  },
  {
    id: 'p-2',
    name: '이수진',
    currentCompany: '네이버',
    currentTitle: '책임리더',
    currentDepartment: '클라우드 AI랩',
    mobile: '010-9876-5432',
    email: 'sujin.lee@navercorp.com',
    primaryDomain: '초거대 AI/LLM',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    skills: ['LLM', 'AI 모델링'],
    careers: [],
    academics: [],
    connectionChannel: 'business_card',
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    isStale: false
  }
];

describe('5대 통합 스튜디오 (The 5 Unified Studios) 렌더링 및 무결성 검증', () => {
  describe('1. SmartCardScannerStudio (스마트 명함 스캐너 스튜디오)', () => {
    it('단일 1초 스캔 모드에서 Vision AI 및 쿼터 정보가 정상 렌더링되어야 한다', () => {
      const html = renderToString(
        <SmartCardScannerStudio
          initialMode="single"
          onSavePerson={vi.fn()}
          onClose={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('명함 원터치 지능형 스캔');
      expect(html).toContain('단일 1초 스캔');
      expect(html).toContain('연속 일괄 스캔');
      expect(html).toContain('명함 사진 파일 업로드');
      expect(html).toContain('실시간 카메라 촬영');
      expect(html).toContain('오늘 무료');
    });

    it('연속 일괄 스캔 모드에서 배치 대기열 및 파일 드롭존이 정상 렌더링되어야 한다', () => {
      const html = renderToString(
        <SmartCardScannerStudio
          initialMode="batch"
          onSavePerson={vi.fn()}
          onSaveBatch={vi.fn()}
          onClose={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('연속 일괄 스캔');
      expect(html).toContain('여러 장의 명함 파일 한 번에 선택');
    });
  });

  describe('2. ExecutiveMeetingStudio (C-Level 미팅 & 티타임 준비 스튜디오)', () => {
    it('1-Page 스마트 브리프 탭에서 DART 팩트 및 5대 인재 클러스터 특화 화두가 렌더링되어야 한다', () => {
      const html = renderToString(
        <ExecutiveMeetingStudio
          isOpen={true}
          initialTab="brief"
          person={mockPeople[0]}
          allPeople={mockPeople}
          onClose={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('경영진 미팅 &amp; 티타임 스튜디오');
      expect(html).toContain('김태원');
      expect(html).toContain('삼성전자');
      expect(html).toContain('DART 금융감독원 공시 검증 내역');
      expect(html).toContain('미팅 에티켓');
    });

    it('티타임 3대 의제 탭에서 .ICS 캘린더 생성 및 추천 장소 조율 UI가 렌더링되어야 한다', () => {
      const html = renderToString(
        <ExecutiveMeetingStudio
          isOpen={true}
          initialTab="teatime"
          person={mockPeople[0]}
          allPeople={mockPeople}
          onClose={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('티타임 3대 의제');
      expect(html).toContain('미팅 일시 및 프라이빗 C-Level 명소 조율');
      expect(html).toContain('캘린더 초대장 원클릭 다운로드');
    });
  });

  describe('3. ExecutiveDebriefStudio (미팅 회고 & 후속 소통 스튜디오)', () => {
    it('음성 모드 및 텍스트 모드 전환 탭이 정상 렌더링되어야 한다', () => {
      const html = renderToString(
        <ExecutiveDebriefStudio
          isOpen={true}
          initialMode="text"
          person={mockPeople[1]}
          people={mockPeople}
          onClose={vi.fn()}
          onUpdatePerson={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('미팅 회고 &amp; 감사 서신 스튜디오');
      expect(html).toContain('텍스트 타이핑 모드');
      expect(html).toContain('이수진');
    });
  });

  describe('4. WarmIntroHubStudio (신뢰 소개 허브 스튜디오)', () => {
    it('최단 신뢰 소개 경로 탭 및 Double Opt-in 소개 탭이 정상 렌더링되어야 한다', () => {
      const html = renderToString(
        <WarmIntroHubStudio
          isOpen={true}
          initialTab="find_path"
          people={mockPeople}
          targetPerson={mockPeople[1]}
          onClose={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('신뢰 소개 허브 스튜디오');
      expect(html).toContain('최단 신뢰 소개 경로');
      expect(html).toContain('두 인연 이어주기');
    });
  });

  describe('5. DataVaultSecurityStudio (데이터 볼트 & 보안 동기화 스튜디오)', () => {
    it('BOM CSV, AES-256 암호화 볼트, 클라우드 동기화 3대 탭이 정상 렌더링되어야 한다', () => {
      const html = renderToString(
        <DataVaultSecurityStudio
          isOpen={true}
          initialTab="vault"
          people={mockPeople}
          onUpdatePeople={vi.fn()}
          onClose={vi.fn()}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toContain('보안 &amp; 데이터 볼트 센터');
      expect(html).toContain('CSV &amp; 암호화 볼트 백업/복원');
      expect(html).toContain('AES-256 마스터 보안 키');
      expect(html).toContain('클라우드 &amp; 오프라인 동기화');
      expect(html).toContain('UTF-8 BOM');
    });
  });
});
