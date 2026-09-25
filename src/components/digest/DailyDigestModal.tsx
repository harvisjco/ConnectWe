import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  Sparkles, Cake, Clock, Copy, Check, 
  Phone, Mail, ArrowRight
} from 'lucide-react';
import { ModalShell, Badge, Button } from '../ui';

interface DailyDigestModalProps {
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  people,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // 1. 소통 단절(6개월 이상) 핵심 1촌 (최대 3명)
  const staleCorePeople = people
    .filter(p => p.isStale && p.closeness <= 3)
    .slice(0, 3);

  // 2. 생일/기념일 대상 (시뮬레이션 포함)
  const birthdayPeople = people.filter(p => {
    if (!p.birthYear) return false;
    // 시드 인물 중 샘플 매칭
    return p.id === 'p_1' || p.id === 'p_6';
  });

  // 메시지 템플릿 생성기
  const generateMessageTemplate = (person: Person, type: 'birthday' | 'catchup') => {
    if (type === 'birthday') {
      return `${person.name} ${person.currentTitle}님, 생신 진심으로 축하드립니다! 🎉 올 한 해도 뜻하시는 모든 사업과 연구에서 큰 성취 이루시길 항상 응원하겠습니다. 조만간 편하신 때 따뜻한 차 한잔 모시겠습니다. - [내 이름] 드림`;
    }
    return `${person.name} ${person.currentTitle}님, 오랜만에 인사드립니다. 최근 ${person.currentCompany}의 활발한 행보 늘 인상 깊게 지켜보고 있습니다. 바쁘신 일정 중에도 건강 잘 챙기시고, 근처 오실 일 있으실 때 가볍게 티타임 나누면 좋겠습니다! - [내 이름] 드림`;
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('축하/안부 메시지가 클립보드에 복사되었습니다. 카카오톡이나 문자에 바로 붙여넣으세요.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="데일리 인맥 지능 다이제스트"
      subtitle="오늘 챙겨야 할 생일 지인과 소통이 뜸해진 핵심 1촌을 위한 맞춤형 안부 브리핑입니다."
      badge={<Badge variant="brand">{currentMonth}월 {currentDay}일</Badge>}
      icon={<Sparkles className="w-5 h-5 text-white" />}
      maxWidth="2xl"
      footer={
        <Button variant="primary" onClick={onClose} size="md">
          확인 및 닫기
        </Button>
      }
    >
      <div className="space-y-6">

          {/* Section 1: Birthday Celebrations */}
          {birthdayPeople.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                <Cake className="w-4 h-4" />
                <span>오늘의 생일 / 기념일 인맥 ({birthdayPeople.length}명)</span>
              </div>

              <div className="space-y-3">
                {birthdayPeople.map(person => {
                  const bdayMsg = generateMessageTemplate(person, 'birthday');
                  return (
                    <div key={person.id} className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-pink-950/20 dark:via-slate-900 dark:to-slate-900 border border-pink-200 dark:border-pink-500/30 shadow-sm space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{person.name}</span>
                            <span className="text-xs text-pink-600 dark:text-pink-300 font-semibold">🎂 오늘 생일</span>
                            {person.sourceType === 'DART_FACT' && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                                🏛️ DART FACT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {person.currentCompany} · {person.currentTitle}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onSelectPerson(person);
                            onClose();
                          }}
                          className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
                        >
                          프로필 <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Message Preview & One-click Copy */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        "{bdayMsg}"
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-mono text-slate-400">{person.mobile}</span>
                        <button
                          onClick={() => handleCopy(`bday_${person.id}`, bdayMsg)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-sm shadow-pink-600/20 transition-all active:scale-95"
                        >
                          {copiedId === `bday_${person.id}` ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === `bday_${person.id}` ? '복사 완료!' : '카톡 축하문 복사'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Stale Core 1st-Degree Connections */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              <span>관계 유지가 필요한 소통 단절 핵심 1촌 (6개월 이상)</span>
            </div>

            {staleCorePeople.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center">
                현재 6개월 이상 소통이 단절된 핵심 1촌이 없습니다. 인맥 관리가 훌륭히 유지되고 있습니다!
              </p>
            ) : (
              <div className="space-y-3">
                {staleCorePeople.map(person => {
                  const catchupMsg = generateMessageTemplate(person, 'catchup');
                  return (
                    <div key={person.id} className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-500/30 shadow-sm space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{person.name}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                              최근 소통: {person.lastContactDate || '6개월 이상 경과'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-0.5">
                            {person.currentCompany} · {person.currentTitle}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onSelectPerson(person);
                            onClose();
                          }}
                          className="text-xs text-slate-500 hover:text-amber-700 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
                        >
                          인스펙터 <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Catchup Message Template */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        "{catchupMsg}"
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                          <a
                            href={`tel:${person.mobile}`}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Phone className="w-3.5 h-3.5" /> 전화
                          </a>
                          <a
                            href={`mailto:${person.email}`}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" /> 메일
                          </a>
                        </div>

                        <button
                          onClick={() => handleCopy(`catchup_${person.id}`, catchupMsg)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm shadow-amber-600/20 transition-all active:scale-95"
                        >
                          {copiedId === `catchup_${person.id}` ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === `catchup_${person.id}` ? '복사 완료!' : '안부 메시지 복사'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
    </ModalShell>
  );
};
