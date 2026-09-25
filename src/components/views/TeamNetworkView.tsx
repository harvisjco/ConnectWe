import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { TeamMember, TeamSharedContact } from '../../types/teamNetwork';
import { 
  Users, ShieldCheck, Search, Share2, 
  Copy, Building2, Lock
} from 'lucide-react';
import { ViewHeader } from '../ui';

interface TeamNetworkViewProps {
  people: Person[];
  onShowToast: (msg: string) => void;
}

export const TeamNetworkView: React.FC<TeamNetworkViewProps> = ({
  people,
  onShowToast
}) => {
  // 팀 멤버 시뮬레이션
  const teamMembers: TeamMember[] = [
    { id: 'tm-1', name: '김태호', department: '전략기획실', role: '전략이사', avatarColor: 'bg-indigo-600', contactCount: 42 },
    { id: 'tm-2', name: '이지은', department: '투자심사본부', role: '수석심사역', avatarColor: 'bg-purple-600', contactCount: 38 },
    { id: 'tm-3', name: '박준혁', department: 'HR·피플팀', role: '탤런트리드', avatarColor: 'bg-emerald-600', contactCount: 51 },
    { id: 'tm-me', name: '나 (본인)', department: '비즈니스개발', role: '그로스리드', avatarColor: 'bg-sky-600', contactCount: people.length }
  ];

  // 전화번호 마스킹 헬퍼
  const maskPhone = (phone: string) => {
    return phone.replace(/^(\d{2,3})-(\d{3,4})-(\d{4})$/, '$1-****-$3');
  };

  // 이메일 마스킹 헬퍼
  const maskEmail = (email: string) => {
    if (!email) return '미공개';
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const namePart = parts[0];
    const masked = namePart.length > 2 ? `${namePart.slice(0, 2)}***` : `${namePart.slice(0, 1)}*`;
    return `${masked}@${parts[1]}`;
  };

  // 본인 인맥 + 팀원 인맥 결합
  const sharedContacts: TeamSharedContact[] = useMemo(() => {
    // 1. 본인 인맥 변환
    const myContacts: TeamSharedContact[] = people.map(p => ({
      id: `shared-my-${p.id}`,
      ownerMemberId: 'tm-me',
      ownerMemberName: '나 (본인)',
      ownerDepartment: '비즈니스개발',
      targetName: p.name,
      targetCompany: p.currentCompany,
      targetTitle: p.currentTitle,
      maskedMobile: maskPhone(p.mobile),
      maskedEmail: maskEmail(p.email),
      relationshipStrength: 'STRONG',
      lastInteractedAt: p.lastContactDate || '최근',
      isDartExecutive: p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector
    }));

    // 2. 동료 팀원들의 샘플 공유 인맥 (PII 마스킹 상태)
    const peerContacts: TeamSharedContact[] = [
      {
        id: 'shared-peer-1',
        ownerMemberId: 'tm-1',
        ownerMemberName: '김태호 전략이사',
        ownerDepartment: '전략기획실',
        targetName: '이해진',
        targetCompany: 'NAVER',
        targetTitle: '글로벌투자책임자(GIO) / 이사회 의장',
        maskedMobile: '010-****-1999',
        maskedEmail: 'h***@navercorp.com',
        relationshipStrength: 'STRONG',
        lastInteractedAt: '2026-05-12',
        isDartExecutive: true
      },
      {
        id: 'shared-peer-2',
        ownerMemberId: 'tm-2',
        ownerMemberName: '이지은 수석심사역',
        ownerDepartment: '투자심사본부',
        targetName: '정신아',
        targetCompany: '카카오',
        targetTitle: '대표이사',
        maskedMobile: '010-****-2024',
        maskedEmail: 's***@kakaocorp.com',
        relationshipStrength: 'MEDIUM',
        lastInteractedAt: '2026-04-20',
        isDartExecutive: true
      },
      {
        id: 'shared-peer-3',
        ownerMemberId: 'tm-3',
        ownerMemberName: '박준혁 탤런트리드',
        ownerDepartment: 'HR·피플팀',
        targetName: '한종희',
        targetCompany: '삼성전자',
        targetTitle: '부회장 / 대표이사',
        maskedMobile: '010-****-2022',
        maskedEmail: 'j***@samsung.com',
        relationshipStrength: 'STRONG',
        lastInteractedAt: '2026-06-01',
        isDartExecutive: true
      },
      {
        id: 'shared-peer-4',
        ownerMemberId: 'tm-1',
        ownerMemberName: '김태호 전략이사',
        ownerDepartment: '전략기획실',
        targetName: '곽노정',
        targetCompany: 'SK하이닉스',
        targetTitle: '대표이사 사장',
        maskedMobile: '010-****-2021',
        maskedEmail: 'n***@sk.com',
        relationshipStrength: 'MEDIUM',
        lastInteractedAt: '2026-03-15',
        isDartExecutive: true
      }
    ];

    return [...myContacts, ...peerContacts];
  }, [people]);

  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [requestTarget, setRequestTarget] = useState<TeamSharedContact | null>(null);

  // 필터링된 인맥 목록
  const filteredContacts = useMemo(() => {
    return sharedContacts.filter(c => {
      if (selectedMemberId !== 'all' && c.ownerMemberId !== selectedMemberId) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = c.targetName.toLowerCase().includes(q);
        const matchComp = c.targetCompany.toLowerCase().includes(q);
        const matchTitle = c.targetTitle.toLowerCase().includes(q);
        const matchOwner = c.ownerMemberName.toLowerCase().includes(q);
        if (!matchName && !matchComp && !matchTitle && !matchOwner) return false;
      }
      return true;
    });
  }, [sharedContacts, selectedMemberId, searchTerm]);

  // 사내 소개 요청 텍스트 생성 및 클립보드 복사
  const handleCopyIntroRequest = (contact: TeamSharedContact) => {
    const text = `[사내 인맥 소개 요청]\n안녕하세요 ${contact.ownerMemberName}님, 이번 사업 제휴/영입 건과 관련하여 알고 계신 ${contact.targetCompany} ${contact.targetName} ${contact.targetTitle}님과의 미팅 또는 티타임 소개를 정중히 부탁드리고자 합니다. 편하신 시간에 메신저나 커피챗으로 상의드릴 수 있을까요? 감사합니다!`;
    navigator.clipboard.writeText(text);
    onShowToast(`사내 메신저 소개 요청 문구가 복사되었습니다 (${contact.targetName} 대상)`);
    setRequestTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={Users}
        title="B2B 팀 인맥 공유 풀"
        subtitle="동료들의 개인 휴대전화번호·개인 메일은 철저히 마스킹 보호되며, 누가 어느 회사 임원과 1촌인지만 안전하게 결합 조회합니다."
        englishTag="Team Shared Rolodex"
        badge={
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30 font-semibold flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Zero-Leak PII 마스킹 보호</span>
          </span>
        }
        actions={
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs font-mono">
            팀 총 공유 인맥: <strong className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">{sharedContacts.length}명</strong>
          </div>
        }
      />

      {/* 2. 팀원 필터 & 검색 바 */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">팀원 선택:</span>
          <button
            onClick={() => setSelectedMemberId('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
              selectedMemberId === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            전체 팀원 ({sharedContacts.length})
          </button>
          {teamMembers.map(tm => (
            <button
              key={tm.id}
              onClick={() => setSelectedMemberId(tm.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium shrink-0 transition-all ${
                selectedMemberId === tm.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${tm.avatarColor}`} />
              <span>{tm.name} ({tm.department})</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="찾으시는 지인 이름, 소속 기업, 직함, 팀원명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 3. 공유 인맥 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredContacts.map(c => (
          <div
            key={c.id}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all space-y-3 shadow-sm"
          >
            {/* Header: 소유 팀원 & DART 뱃지 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 font-mono">
                  소유: {c.ownerMemberName}
                </span>
                {c.isDartExecutive && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>DART 공시</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                관계 강도: <strong className="text-slate-900 font-semibold">{c.relationshipStrength}</strong>
              </span>
            </div>

            {/* 인물 정보 */}
            <div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-bold text-slate-900">{c.targetName}</h4>
                <span className="text-xs text-indigo-600 font-medium">{c.targetTitle}</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{c.targetCompany}</span>
              </div>
            </div>

            {/* PII 마스킹 영역 */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>연락처 (마스킹):</span>
                <span className="font-mono text-slate-800 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>{c.maskedMobile}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>이메일 (마스킹):</span>
                <span className="font-mono text-slate-800 font-medium">{c.maskedEmail}</span>
              </div>
            </div>

            {/* Action: 사내 동료에게 소개 요청 */}
            {c.ownerMemberId !== 'tm-me' ? (
              <button
                onClick={() => setRequestTarget(c)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all active:scale-95 min-h-[36px]"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{c.ownerMemberName.split(' ')[0]}님께 소개 요청하기</span>
              </button>
            ) : (
              <div className="py-2 text-center text-xs text-slate-400 font-medium min-h-[36px] flex items-center justify-center">
                (본인 소유 인맥)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 사내 소개 요청 팝업 모달 */}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  사내 메신저 소개 요청 문구 생성
                </h3>
              </div>
              <button onClick={() => setRequestTarget(null)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              동료 <strong>{requestTarget.ownerMemberName}</strong>님께 전송할 사내 메신저(슬랙/잔디/카톡) 텍스트입니다.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
              {`[사내 인맥 소개 요청]\n안녕하세요 ${requestTarget.ownerMemberName}님, 이번 사업 건과 관련하여 알고 계신 ${requestTarget.targetCompany} ${requestTarget.targetName} ${requestTarget.targetTitle}님과의 미팅 또는 티타임 소개를 정중히 부탁드리고자 합니다. 편하신 시간에 상의드릴 수 있을까요? 감사합니다!`}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRequestTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => handleCopyIntroRequest(requestTarget)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>문구 복사 및 완료</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
