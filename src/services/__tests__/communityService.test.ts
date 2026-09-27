import { describe, it, expect } from 'vitest';
import { 
  extractAlumniGroups, 
  getUpcomingBirthdays, 
  generateBirthdayMessage,
  toggleJoinGathering 
} from '../communityService';
import { Person } from '../../types/network';

describe('communityService (일반 회원 동문 그룹, 생일 챙기기, 소모임)', () => {
  const mockPeople: Person[] = [
    {
      id: 'p-1',
      name: '김태호',
      currentCompany: '네이버',
      currentDepartment: '클라우드',
      currentTitle: '책임리더',
      mobile: '010-1234-5678',
      email: 'th.kim@navercorp.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'AI/LLM',
      skills: ['AI'],
      careers: [],
      academics: [
        { schoolName: '서울대학교', degree: '학사', major: '컴퓨터공학', source: 'SOURCE_DATA' }
      ],
      closeness: 2,
      isStale: false,
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'manual'
    },
    {
      id: 'p-2',
      name: '이지은',
      currentCompany: '카카오',
      currentDepartment: '기술전략',
      currentTitle: '이사',
      mobile: '010-9876-5432',
      email: 'je.lee@kakaocorp.com',
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      primaryDomain: '플랫폼',
      skills: ['핀테크'],
      careers: [],
      academics: [
        { schoolName: '연세대학교', degree: '학사', major: '경영학', source: 'SOURCE_DATA' }
      ],
      closeness: 2,
      isStale: false,
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'manual'
    }
  ];

  it('동문 그룹이 학교/전공/회사별로 정상 매칭되어야 한다', () => {
    const groups = extractAlumniGroups(mockPeople);
    expect(groups.length).toBeGreaterThan(0);
    const snuGroup = groups.find(g => g.name.includes('서울대학교'));
    expect(snuGroup).toBeDefined();
    expect(snuGroup?.memberIds).toContain('p-1');
  });

  it('다가오는 생일자 목록과 D-Day가 계산되어야 한다', () => {
    const birthdays = getUpcomingBirthdays(mockPeople);
    expect(birthdays.length).toBeGreaterThan(0);
    expect(birthdays[0]).toHaveProperty('daysUntil');
    expect(birthdays[0]).toHaveProperty('isToday');
  });

  it('생일 축하 메시지 템플릿(정중/친근/동문)이 바르게 생성되어야 한다', () => {
    const contact = {
      id: 'p-1',
      name: '김태호',
      company: '네이버',
      title: '책임리더',
      birthday: '05-18',
      daysUntil: 0,
      isToday: true,
      mobile: '010-1234-5678',
      hasCongratulated: false
    };
    const polite = generateBirthdayMessage(contact, 'polite');
    const friendly = generateBirthdayMessage(contact, 'friendly');
    const alumni = generateBirthdayMessage(contact, 'alumni');

    expect(polite).toContain('생신을 진심으로 축하드립니다');
    expect(friendly).toContain('오늘 생일 정말 축하드려요');
    expect(alumni).toContain('동문으로서');
  });

  it('소모임 참가 신청 및 취소가 정상 토글되어야 한다', () => {
    const member = { id: 'test-user', name: '테스터', company: '스타트업', title: '팀장' };
    const updated = toggleJoinGathering('g-1', member);
    const target = updated.find(g => g.id === 'g-1');
    expect(target).toBeDefined();
    expect(target?.attendees.some(a => a.personId === 'test-user')).toBe(true);

    // 다시 토글하면 취소
    const toggledAgain = toggleJoinGathering('g-1', member);
    const targetAfter = toggledAgain.find(g => g.id === 'g-1');
    expect(targetAfter?.attendees.some(a => a.personId === 'test-user')).toBe(false);
  });
});
