import { Person } from '../types/network';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedPeople?: Person[];
  actionType?: 'intro_template' | 'coffee_chat' | 'stale_reminder' | 'search_result';
  suggestedAction?: {
    label: string;
    payload: string;
  };
  timestamp: string;
}

/**
 * 2촌 소개를 부탁하기 위해 중간 연결자(1촌)에게 보낼 정중한 소개 요청 메시지(Warm Intro) 생성
 */
export function generateWarmIntroMessage(
  bridgePerson: Person,
  targetPerson: Person,
  meName: string = '나'
): string {
  return `안녕하세요, ${bridgePerson.name}님! ${meName}입니다. 평안히 잘 지내고 계신지요?

다름이 아니라, ${bridgePerson.name}님의 소중한 지인이신 [${targetPerson.currentCompany} ${targetPerson.name} ${targetPerson.currentTitle}]님과 관련하여 조언을 구하고자 조심스럽게 연락드렸습니다.

현재 저희 측에서 ${targetPerson.primaryDomain} 분야와 관련하여 의미 있는 협력 아젠다를 논의 중인데, ${targetPerson.name}님의 고견을 경청할 수 있는 짧은 티타임 기회를 타진해보고자 합니다.

혹시 부담스럽지 않으시다면, ${targetPerson.name}님께 가볍게 저를 소개해 주시거나 연락처를 공유해 주실 수 있으실지 여쭙고 싶습니다.

바쁘신 일정 중에 번거로운 부탁을 드려 송구하며, 늘 감사드립니다. 좋은 하루 보내세요!

- ${meName} 배상`;
}

/**
 * 오랜 기간 연락이 끊긴 지인에게 보낼 센스 있는 안부 메시지 템플릿 생성
 */
export function generateReconnectionMessage(
  targetPerson: Person,
  meName: string = '나'
): string {
  const companyInfo = targetPerson.currentCompany ? `${targetPerson.currentCompany}에서 ` : '';
  const domainInfo = targetPerson.primaryDomain ? `${targetPerson.primaryDomain} 쪽으로 ` : '';

  return `안녕하세요, ${targetPerson.name}님! ${meName}입니다. 정말 오랜만에 안부 여쭙습니다.

최근 ${companyInfo}${domainInfo}멋진 활약 이어가고 계신다는 소식 전해 듣고 반가운 마음에 연락드리게 되었습니다.

시간이 꽤 흘렀는데 늘 건강히 잘 지내고 계시는지요? 
가까운 시일 내에 부담 없는 일정으로 가볍게 차 한잔 나누며 근황도 나누고 싶습니다.

일교차 큰 날씨에 감기 조심하시고, 편하실 때 답장 부탁드립니다! 😊`;
}

/**
 * 자연어 질의를 분석하여 맞춤 인맥을 추천하고 답변을 구성하는 온브라우저 코파일럿 엔진
 */
export function processCopilotQuery(
  query: string,
  people: Person[],
  _meName: string = '나'
): CopilotMessage {
  const q = query.trim().toLowerCase();
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // 1. 커피챗 / 가벼운 만남 / 점심 추천
  if (q.includes('커피챗') || q.includes('만날') || q.includes('점심') || q.includes('식사') || q.includes('차 한잔')) {
    // 친밀도 높고(closeness 2, 3), 최근 180일 내 소통 기록이 있거나 전문 분야가 뚜렷한 1촌
    const candidates = people
      .filter(p => p.closeness !== 1)
      .sort((a, b) => {
        // 친밀도 우선, DART 검증 가산
        const scoreA = (a.closeness === 2 ? 10 : 5) + (a.dartInfo ? 3 : 0);
        const scoreB = (b.closeness === 2 ? 10 : 5) + (b.dartInfo ? 3 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `이번 주 가볍게 커피챗이나 식사를 나누기 좋은 핵심 1촌 지인 3명을 추천해 드립니다. 전문 도메인과 관계 온도가 높아 유익한 대화가 기대됩니다.`,
      matchedPeople: candidates,
      actionType: 'coffee_chat',
      timestamp: timeStr
    };
  }

  // 2. 소통 단절 / 연락 안 한 / 미소통 / 안부
  if (q.includes('연락 안') || q.includes('미소통') || q.includes('단절') || q.includes('오랜만') || q.includes('안부')) {
    const staleList = people
      .filter(p => p.closeness !== 1 && p.isStale)
      .slice(0, 4);

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `6개월 이상 소통이 단절되어 관계 복원이 시급한 주요 지인들입니다. 아래 인맥 카드에서 [안부 메시지]를 생성해 부담 없이 연락을 건네보세요.`,
      matchedPeople: staleList,
      actionType: 'stale_reminder',
      timestamp: timeStr
    };
  }

  // 3. 특정 기업 / 알럼나이 질의 (예: 네이버, 카카오, 삼성전자, 쿠팡 등)
  const matchedCompany = ['네이버', '카카오', '삼성전자', '쿠팡', '토스', '현대자동차', 'sk', 'lg'].find(c => q.includes(c));
  if (matchedCompany) {
    const companyPeople = people.filter(p => {
      if (p.closeness === 1) return false;
      const allC = [p.currentCompany, ...p.careers.map(c => c.companyName)].join(' ').toLowerCase();
      return allC.includes(matchedCompany);
    }).slice(0, 4);

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `[${matchedCompany.toUpperCase()}] 재직 또는 전직(알럼나이) 이력이 확인된 인맥 ${companyPeople.length}명을 찾았습니다.`,
      matchedPeople: companyPeople,
      actionType: 'search_result',
      timestamp: timeStr
    };
  }

  // 4. 특정 도메인 질의 (AI, 클라우드, 투자, VC, 반도체, 금융 등)
  const matchedDomain = ['ai', '인공지능', '클라우드', '투자', 'vc', '반도체', 'm&a', '재무'].find(d => q.includes(d));
  if (matchedDomain) {
    const domainPeople = people.filter(p => {
      if (p.closeness === 1) return false;
      const allText = `${p.primaryDomain} ${p.skills.join(' ')} ${p.currentTitle}`.toLowerCase();
      return allText.includes(matchedDomain);
    }).slice(0, 4);

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `[${matchedDomain.toUpperCase()}] 관련 전문 역량과 이력을 보유한 핵심 인맥 ${domainPeople.length}명입니다.`,
      matchedPeople: domainPeople,
      actionType: 'search_result',
      timestamp: timeStr
    };
  }

  // 5. 기본 질의: 이름 또는 키워드 매칭
  const searchResults = people.filter(p => {
    if (p.closeness === 1) return false;
    const text = `${p.name} ${p.currentCompany} ${p.currentTitle} ${p.primaryDomain} ${p.memo || ''}`.toLowerCase();
    return text.includes(q);
  }).slice(0, 4);

  if (searchResults.length > 0) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `질문하신 내용과 연관된 인맥 ${searchResults.length}명을 발견했습니다. 상세 카드를 클릭해 DART 공시 팩트와 미팅 전략을 확인하실 수 있습니다.`,
      matchedPeople: searchResults,
      actionType: 'search_result',
      timestamp: timeStr
    };
  }

  // 6. 매칭 없을 시 친절한 가이드
  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: `질문하신 내용과 정확히 일치하는 인맥을 찾지 못했습니다. 다음과 같이 질문해 보세요:\n\n• "이번 주에 커피챗할 만한 지인 추천해줘"\n• "오랫동안 연락 안 한 C-Level 누구 있어?"\n• "네이버나 삼성전자 출신 인맥 찾아줘"`,
    timestamp: timeStr
  };
}
