import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  generateCadenceGreetings, 
  CadenceGreetingPreset 
} from '../../services/promotionRadarService';
import { 
  X, Clock, Copy, Check, MessageSquare, 
  ShieldCheck, CheckCircle2, Building2
} from 'lucide-react';

interface CadenceGreetingModalProps {
  person: Person;
  daysSinceLastContact: number;
  onUpdatePerson: (updatedPerson: Person) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const CadenceGreetingModal: React.FC<CadenceGreetingModalProps> = ({
  person,
  daysSinceLastContact,
  onUpdatePerson,
  onClose,
  onShowToast
}) => {
  const [presets] = useState<CadenceGreetingPreset[]>(() => 
    generateCadenceGreetings(person, daysSinceLastContact)
  );
  const [selectedType, setSelectedType] = useState<string>('WARM_TEA_INVITE');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const activePreset = presets.find(p => p.type === selectedType) || presets[0];

  // 안부 메시지 복사
  const handleCopy = (preset: CadenceGreetingPreset) => {
    navigator.clipboard.writeText(preset.content).then(() => {
      setCopiedType(preset.type);
      onShowToast(`[${preset.title}] 안부 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  // 소통 완료 처리 (골든타임 주기 리셋)
  const handleMarkAsContacted = () => {
    const today = new Date().toISOString().slice(0, 10);
    const updated: Person = {
      ...person,
      lastContactDate: today,
      isStale: false
    };

    onUpdatePerson(updated);
    onShowToast(`[${person.name}] 님과의 소통이 완료되어 골든타임 주기가 리셋되었습니다.`);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  소통 골든타임 케어 &amp; 정기 안부
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                  {daysSinceLastContact}일 경과
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                소중한 인연이 소홀해지지 않도록 따뜻한 관심과 안부를 자연스럽게 전합니다.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Target Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{person.name}</span>
                <span className="text-xs text-slate-500">{person.currentTitle}</span>
                {person.dartInfo && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5 font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    DART 임원
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{person.currentCompany}</span>
                <span>•</span>
                <span>마지막 소통: {person.lastContactDate || '180일 이전'}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">소통 주기 경고</div>
              <div className="text-xs font-bold text-rose-600 font-mono">
                {daysSinceLastContact >= 150 ? '심각한 단절 위험' : '정기 안부 권장'}
              </div>
            </div>
          </div>

          {/* Preset Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">상황별 맞춤 안부 카피 선택</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(p => (
                <button
                  key={p.type}
                  onClick={() => setSelectedType(p.type)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedType === p.type
                      ? 'bg-blue-50/80 border-blue-500 shadow-2xs text-blue-900 font-bold'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-normal mb-0.5">{p.badge}</div>
                  <div className="text-xs truncate">{p.title.split('&')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Preset Message Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                {activePreset.title}
              </span>
              <button
                onClick={() => handleCopy(activePreset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                  copiedType === activePreset.type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedType === activePreset.type ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === activePreset.type ? '복사 완료' : '메시지 복사'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-2xs">
              {activePreset.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            * 카카오톡이나 문자 메시지로 안부를 전하신 후 완료 버튼을 눌러주세요.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              닫기
            </button>
            <button
              onClick={handleMarkAsContacted}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>오늘 안부 완료</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
