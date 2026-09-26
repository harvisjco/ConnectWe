import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  X, GitFork, ArrowRight, ShieldCheck, Sparkles, 
  Copy, Check, UserCheck
} from 'lucide-react';

interface DegreesOfSeparationModalProps {
  targetPerson: Person;
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast?: (msg: string) => void;
}

type WarmIntroTone = 'formal' | 'coffee' | 'alumni';
type WarmIntroPurpose = 'business' | 'coffee_chat' | 'recruiting' | 'investment';

interface BridgeItem {
  bridge: Person;
  trustScore: number;
  trustGrade: 'VERIFIED_GOLD' | 'VERIFIED_SILVER' | 'NETWORK';
  overlapReasons: string[];
}

export const DegreesOfSeparationModal: React.FC<DegreesOfSeparationModalProps> = ({
  targetPerson,
  people,
  onClose,
  onSelectPerson,
  onShowToast = () => {}
}) => {
  // 1촌 다리(Bridge) 후보자 발굴 및 신뢰 점수(Trust Score) 계산
  const targetCompanies = new Set([
    targetPerson.currentCompany,
    ...targetPerson.careers.map(c => c.companyName)
  ]);
  const targetSchools = new Set(targetPerson.academics.map(a => a.schoolName));

  const bridgeList: BridgeItem[] = people
    .filter(p => p.id !== targetPerson.id && p.closeness <= 3)
    .map(bridge => {
      let trustScore = 50;
      const reasons: string[] = [];

      // 1. 현재 직장 동료 여부 (신뢰도 최상)
      if (bridge.currentCompany === targetPerson.currentCompany) {
        trustScore += 45;
        reasons.push(`현재 같은 직장(${bridge.currentCompany}) 재직 중`);
      }

      // 2. 과거 전직 이력(알럼나이) 겹침 검사
      bridge.careers.filter(c => !c.isCurrent).forEach(c => {
        if (targetCompanies.has(c.companyName)) {
          trustScore += 30;
          reasons.push(`과거 ${c.companyName} 동문/동료 재직 이력 공유`);
        }
      });

      // 3. 학교/동문 네트워크 겹침 검사
      bridge.academics.forEach(a => {
        if (targetSchools.has(a.schoolName)) {
          trustScore += 20;
          reasons.push(`${a.schoolName} 동문 네트워크`);
        }
      });

      // 4. 친밀도 가산점 (핵심 1촌)
      if (bridge.closeness === 2) trustScore += 10;

      const finalScore = Math.min(99, trustScore);
      const trustGrade: 'VERIFIED_GOLD' | 'VERIFIED_SILVER' | 'NETWORK' = 
        finalScore >= 85 ? 'VERIFIED_GOLD' : finalScore >= 70 ? 'VERIFIED_SILVER' : 'NETWORK';

      return {
        bridge,
        trustScore: finalScore,
        trustGrade,
        overlapReasons: reasons
      };
    })
    .filter(item => item.overlapReasons.length > 0)
    .sort((a, b) => b.trustScore - a.trustScore);

  // Warm Intro Generator State
  const [activeBridgeId, setActiveBridgeId] = useState<string | null>(
    bridgeList.length > 0 ? bridgeList[0].bridge.id : null
  );
  const [introTone, setIntroTone] = useState<WarmIntroTone>('formal');
  const [introPurpose, setIntroPurpose] = useState<WarmIntroPurpose>('business');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const selectedBridgeItem = bridgeList.find(b => b.bridge.id === activeBridgeId);

  // AI Warm Intro 요청문 실시간 생성
  const generateIntroDraft = (bridge: Person, tone: WarmIntroTone, purpose: WarmIntroPurpose): string => {
    const targetRole = `${targetPerson.currentCompany} ${targetPerson.name} ${targetPerson.currentTitle}`;
    const purposeText = 
      purpose === 'business' ? '비즈니스 협력 및 제휴 제안' :
      purpose === 'recruiting' ? '핵심 리더십 영입 타진' :
      purpose === 'investment' ? '투자 유치 및 IR 교류' : '커리어 및 산업 동향 조언';

    if (tone === 'formal') {
      return `${bridge.name} ${bridge.currentTitle}님, 안녕하십니까. 평소 많은 조언 주심에 늘 감사드립니다.

다름이 아니오라, 최근 저희 조직에서 추진 중인 [${purposeText}] 건과 관련하여 ${targetRole}님과의 교류 및 사전 미팅을 타진하고자 연락드리게 되었습니다.

${bridge.name}님께서 ${targetPerson.name}님과 같은 조직 및 네트워크에서 맺으신 깊은 신뢰를 익히 알고 있기에, 실례가 되지 않는다면 가볍게 온/오프라인으로 15분 정도 인사를 나눌 수 있도록 다리를 놓아주실 수(Warm Intro) 있으실지 정중히 여쭙고자 합니다.

바쁘신 일정 중에 번거로운 부탁을 드려 송구하오며, 편하신 시간에 말씀 주시면 감사하겠습니다.`;
    }

    if (tone === 'coffee') {
      return `${bridge.name}님, 오랜만에 인사드립니다! 잘 지내고 계시죠?

최근 ${targetPerson.currentCompany}의 [${purposeText}] 관련 행보를 관심 있게 지켜보다가, ${bridge.name}님께서 ${targetPerson.name}님과 좋은 인연이 있으신 것을 알게 되어 반가운 마음에 연락드렸습니다.

혹시 기회가 되실 때 ${targetPerson.name}님과 편안하게 커피 한 잔 마시며 인사 나눌 수 있도록 소개 한 번 부탁드려도 괜찮을까요? 무리되지 않는 선에서 가볍게 이야기 나눠보고 싶습니다.

조만간 ${bridge.name}님과도 식사 한번 모시겠습니다. 편하게 말씀 주세요!`;
    }

    // alumni tone
    return `${bridge.name} 선배님/동료님! 

이번에 저희 프로젝트에서 [${purposeText}] 관련하여 ${targetPerson.name}님(${targetPerson.currentCompany})과 협력할 수 있는 좋은 기회가 보여 연락드렸습니다.

두 분께서 과거 같은 소속에서 함께 뜻을 맞추셨던 것으로 알고 있어, 선배님의 따뜻한 소개(Warm Intro)로 인사를 건넬 수 있다면 큰 힘이 될 것 같습니다.

시간 되실 때 가볍게 조언 부탁드립니다!`;
  };

  const handleSelectBridge = (bridgeId: string) => {
    setActiveBridgeId(bridgeId);
    const item = bridgeList.find(b => b.bridge.id === bridgeId);
    if (item) {
      setCustomMessage(generateIntroDraft(item.bridge, introTone, introPurpose));
    }
  };

  const handleToneChange = (newTone: WarmIntroTone) => {
    setIntroTone(newTone);
    if (selectedBridgeItem) {
      setCustomMessage(generateIntroDraft(selectedBridgeItem.bridge, newTone, introPurpose));
    }
  };

  const handlePurposeChange = (newPurpose: WarmIntroPurpose) => {
    setIntroPurpose(newPurpose);
    if (selectedBridgeItem) {
      setCustomMessage(generateIntroDraft(selectedBridgeItem.bridge, introTone, newPurpose));
    }
  };

  // 초기 메시지 세팅
  React.useEffect(() => {
    if (selectedBridgeItem && !customMessage) {
      setCustomMessage(generateIntroDraft(selectedBridgeItem.bridge, introTone, introPurpose));
    }
  }, [selectedBridgeItem]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setIsCopied(true);
    onShowToast('소개 요청 메시지가 클립보드에 복사되었습니다. 카카오톡이나 메시지로 전달해보세요.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Modal Dialog */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-sm">
              <GitFork className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">2촌 인맥 탐색 &amp; AI 다리놓기 (Warm Intro)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  Trust Graph
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                [<strong className="text-slate-800">{targetPerson.name}</strong>] 님과 연결될 수 있는 우리 1촌 지인과 AI 맞춤형 소개 요청서를 생성합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-700">
          
          {/* Target Profile Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] text-indigo-600 font-semibold uppercase tracking-wider block">소개 연결 희망 인물</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-slate-900">{targetPerson.name} {targetPerson.currentTitle}</span>
                <span className="text-xs text-slate-500">({targetPerson.currentCompany})</span>
              </div>
            </div>
            {targetPerson.sourceType === 'DART_FACT' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DART FACT 검증 임원
              </span>
            )}
          </div>

          {/* Section 1: Bridges Found */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                소개 다리를 놓아줄 수 있는 1촌 지인 ({bridgeList.length}명 연결 가능)
              </h3>
              <span className="text-[11px] text-slate-400">재직 기간 겹침 및 동문 네트워크 교차 분석</span>
            </div>

            {bridgeList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
                <p className="text-xs text-slate-600">
                  현재 등록된 1촌 지인 중 같은 기업 재직/알럼나이 또는 동문 이력을 공유하는 직접적인 2촌 접점이 발견되지 않았습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  필요하실 때 새로운 명함이나 연락처를 등록하시면 지능형 접점을 자동으로 찾아드립니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bridgeList.map(item => {
                  const isSelected = item.bridge.id === activeBridgeId;

                  return (
                    <div
                      key={item.bridge.id}
                      onClick={() => handleSelectBridge(item.bridge.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 shadow-2xs ${
                        isSelected 
                          ? 'bg-slate-50/80 border-slate-900 ring-1 ring-slate-900/10'
                          : 'bg-white hover:border-slate-300 border-slate-200/90'
                      }`}
                    >
                      {/* Top: Name & Trust Score Badge */}
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.bridge.name} <span className="text-xs font-normal text-slate-500">({item.bridge.currentTitle})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          item.trustGrade === 'VERIFIED_GOLD'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          접점 일치도 {item.trustScore}%
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        {item.bridge.currentCompany}
                      </div>

                      {/* Overlap Reasons */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.overlapReasons.map((r, idx) => (
                          <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1 font-medium">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            {r}
                          </span>
                        ))}
                      </div>

                      {/* Visual Path Flow & Profile Button */}
                      <div className="flex items-center justify-between gap-1.5 text-[11px] pt-2 border-t border-slate-100 font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-600 font-semibold">나</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-800 font-bold">{item.bridge.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-700">{targetPerson.name}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPerson(item.bridge);
                            onClose();
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-semibold shrink-0 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>프로필</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: AI Warm Intro Generator */}
          {selectedBridgeItem && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    [{selectedBridgeItem.bridge.name}] 님께 보낼 AI 맞춤형 Warm Intro 소개 요청서
                  </span>
                </div>

                {/* Tone Selectors */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 self-start sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => handleToneChange('formal')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      introTone === 'formal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    공식 비즈니스
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToneChange('coffee')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      introTone === 'coffee' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    부드러운 티타임
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToneChange('alumni')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      introTone === 'alumni' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    동문/안부
                  </button>
                </div>
              </div>

              {/* Purpose Selectors */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">소개 목적:</span>
                {(['business', 'coffee_chat', 'recruiting', 'investment'] as WarmIntroPurpose[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePurposeChange(p)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer ${
                      introPurpose === p 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90'
                    }`}
                  >
                    {p === 'business' ? '사업제휴' : p === 'coffee_chat' ? '티타임' : p === 'recruiting' ? '인재영입' : '투자IR'}
                  </button>
                ))}
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-slate-400 transition-colors font-sans shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  메시지를 복사하여 카카오톡이나 메신저로 1촌 지인에게 정중히 전달하세요.
                </span>

                <button
                  onClick={handleCopyMessage}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-indigo-300" />}
                  <span>{isCopied ? '복사 완료!' : '소개 요청서 복사'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>신뢰 네트워크 예의 원칙: 1촌 지인의 동의를 거치는 정중한 연결 방식입니다.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
