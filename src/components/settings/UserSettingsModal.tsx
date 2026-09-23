import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  X, User, Key, Shield, 
  Save, Eye, EyeOff, Sparkles
} from 'lucide-react';

interface UserSettingsModalProps {
  mePerson: Person | undefined;
  onUpdateMe: (updated: Person) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  mePerson,
  onUpdateMe,
  onClose,
  onShowToast
}) => {
  // 내 프로필 상태
  const [name, setName] = useState(mePerson?.name || '나 (Me)');
  const [company, setCompany] = useState(mePerson?.currentCompany || 'ConnectWe Corp');
  const [department, setDepartment] = useState(mePerson?.currentDepartment || '경영전략실');
  const [title, setTitle] = useState(mePerson?.currentTitle || '대표이사');
  const [domain, setDomain] = useState(mePerson?.primaryDomain || 'AI/LLM');
  const [mobile, setMobile] = useState(mePerson?.mobile || '010-0000-0000');
  const [email, setEmail] = useState(mePerson?.email || 'me@connectwe.internal');

  // DART OpenAPI Key 상태
  const [dartApiKey, setDartApiKey] = useState(() => {
    return localStorage.getItem('connectwe_dart_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  // 개인정보 마스킹 설정 상태
  const [maskPiiExport, setMaskPiiExport] = useState(() => {
    return localStorage.getItem('connectwe_mask_pii') === 'true';
  });

  // 프로필 저장
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mePerson) return;

    const updated: Person = {
      ...mePerson,
      name,
      currentCompany: company,
      currentDepartment: department,
      currentTitle: title,
      primaryDomain: domain,
      mobile,
      email
    };

    onUpdateMe(updated);
    onShowToast('내 프로필(중심 노드) 정보가 성공적으로 갱신되었습니다.');
  };

  // DART API 키 저장 및 테스트
  const handleSaveApiKey = () => {
    localStorage.setItem('connectwe_dart_api_key', dartApiKey.trim());
    setIsTestingKey(true);
    setTimeout(() => {
      setIsTestingKey(false);
      onShowToast(dartApiKey ? 'DART OpenAPI 키가 등록 및 검증되었습니다.' : 'DART API 키가 제거되었습니다.');
    }, 600);
  };

  // PII 마스킹 토글
  const handleTogglePii = () => {
    const nextVal = !maskPiiExport;
    setMaskPiiExport(nextVal);
    localStorage.setItem('connectwe_mask_pii', String(nextVal));
    onShowToast(`CSV/vCard 내보내기 시 개인정보 마스킹이 ${nextVal ? '활성화' : '비활성화'}되었습니다.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">내 프로필 &amp; 시스템 환경설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 섹션 1: 중심 노드 '나(Me)' 프로필 편집 */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                지식 그래프 중심 노드(나의 정보)
              </h3>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95"
              >
                <Save className="w-3 h-3" />
                <span>저장</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">전문 도메인</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">현재 소속 회사</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">소속 부서</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">직함 / 직책</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">휴대전화</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">이메일</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </form>

          <hr className="border-slate-800" />

          {/* 섹션 2: 금융감독원 DART OpenAPI 키 설정 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              금융감독원 DART OpenAPI 인증키 설정
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open DART 포털(opendart.fss.or.kr)에서 발급받은 무료 API 인증키를 등록하시면 내 인맥의 상장사 임원 변동을 실시간으로 감지합니다.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={dartApiKey}
                  onChange={(e) => setDartApiKey(e.target.value)}
                  placeholder="예: 40자리 인증키 입력..."
                  className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={isTestingKey}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
              >
                {isTestingKey ? '검증 중...' : '키 저장'}
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* 섹션 3: 개인정보보호법(PIPA) 컴플라이언스 마스킹 옵션 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              개인정보보호법(PIPA) 내보내기 마스킹 설정
            </h3>
            
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white">
                  내보내기 시 휴대전화 가운데 4자리 마스킹
                </div>
                <div className="text-[11px] text-slate-400">
                  CSV 또는 외부 전송 시 010-****-1234 형태로 안전하게 변환
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePii}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  maskPiiExport ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    maskPiiExport ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
