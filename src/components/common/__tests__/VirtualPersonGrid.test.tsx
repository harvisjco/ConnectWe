import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { VirtualPersonGrid } from '../VirtualPersonGrid';
import { Person } from '../../../types/network';

const generateSamplePeople = (count: number): Person[] => {
  return Array.from({ length: count }, (_, idx) => ({
    id: `p-${idx + 1}`,
    name: `인맥_${idx + 1}`,
    currentCompany: `회사_${idx + 1}`,
    currentTitle: '대표이사',
    currentDepartment: '경영전략',
    mobile: `010-0000-${String(idx + 1).padStart(4, '0')}`,
    email: `person${idx + 1}@corp.com`,
    sourceType: 'SOURCE_DATA',
    closeness: (((idx % 3) + 1) as 1 | 2 | 3 | 4 | 5),
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'IT',
    skills: ['경영', 'AI'],
    academics: [{ schoolName: '서울대학교', major: '경영학', source: 'SOURCE_DATA' }],
    careers: [],
    connectionChannel: 'manual',
    isStale: false
  }));
};

describe('VirtualPersonGrid - 대규모 인맥 가상 윈도잉 렌더러 검증 (renderToString)', () => {
  it('초기 페이지 크기(pageSize=10)에 맞춰 첫 10개의 카드만 렌더링하고 상태 바를 표시해야 한다', () => {
    const people = generateSamplePeople(35);
    const handleSelect = vi.fn();

    const html = renderToString(
      <VirtualPersonGrid 
        people={people} 
        onSelectPerson={handleSelect} 
        pageSize={10} 
      />
    );

    // 1~10번 인맥 포함 확인
    expect(html).toContain('인맥_1');
    expect(html).toContain('인맥_10');
    // 11번 인맥은 윈도잉에 의해 제외됨
    expect(html).not.toContain('인맥_11');

    // 상태 안내 메시지 확인
    expect(html).toContain('총 35명 중 10명 로드됨');
    expect(html).toContain('인맥 더 보기');
  });

  it('인맥 수가 pageSize 이하일 경우 더 보기 버튼 없이 완료 상태를 렌더링해야 한다', () => {
    const people = generateSamplePeople(5);
    const handleSelect = vi.fn();

    const html = renderToString(
      <VirtualPersonGrid 
        people={people} 
        onSelectPerson={handleSelect} 
        pageSize={10} 
      />
    );

    expect(html).toContain('인맥_1');
    expect(html).toContain('인맥_5');
    expect(html).not.toContain('인맥 더 보기');
  });

  it('빈 배열이 전달되었을 때 크래시 없이 안전하게 빈 그리드를 렌더링해야 한다 (Defensive Programming)', () => {
    const handleSelect = vi.fn();

    const html = renderToString(
      <VirtualPersonGrid 
        people={[]} 
        onSelectPerson={handleSelect} 
        pageSize={10} 
      />
    );

    expect(html).toContain('virtual-person-grid');
    expect(html).not.toContain('인맥 더 보기');
  });
});
