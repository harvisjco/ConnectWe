import React, { useState } from 'react';
import { Person, AgeGroup } from '../../types/network';
import { crossCheckPersonWithDart } from '../../services/dartFactEngine';
import { estimateAgeGroup } from '../../services/rememberParser';
import { 
  X, UserPlus, ShieldCheck, Sparkles, Check
} from 'lucide-react';

interface AddPersonModalProps {
  onClose: () => void;
  onSave: (person: Person) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthYearStr, setBirthYearStr] = useState('');
  const [domain, setDomain] = useState('AI/LLM & Data');
  const [schoolName, setSchoolName] = useState('');
  const [schoolMajor, setSchoolMajor] = useState('');
  const [clubName, setClubName] = useState('');
  const [alumniCompany, setAlumniCompany] = useState('');
  const [alumniTitle, setAlumniTitle] = useState('');
  const [memo, setMemo] = useState('');

  // DART 실시간 검증 상태
  const [isDartChecking, setIsDartChecking] = useState(false);
  const [dartMatchResult, setDartMatchResult] = useState<{ matched: boolean; summary?: string } | null>(null);

  // DART 공시 조회 실행
  const handleCheckDart = () => {
    if (!name.trim() || !company.trim()) {
      alert('이름과 회사명을 먼저 입력해 주세요.');
      return;
    }
    setIsDartChecking(true);
    setTimeout(() => {
      const dummyPerson: Person = {
        id: 'temp',
        name: name.trim(),
        currentCompany: company.trim(),
        currentDepartment: department,
        currentTitle: title,
        mobile,
        email,
        estimatedAgeGroup: '30s',
        isAgeEstimated: true,
        primaryDomain: domain,
        skills: [],
        careers: [],
        academics: [],
        sourceType: 'SOURCE_DATA',
        closeness: 2,
        connectionChannel: 'manual',
        isStale: false
      };

      const result = crossCheckPersonWithDart(dummyPerson);
      if (result.matched && result.dartInfo) {
        setDartMatchResult({
          matched: true,
          summary: `${result.dartInfo.stockName} · ${result.dartInfo.registeredRole} (${result.dartInfo.verifiedAt} 공시)`
        });
      } else {
        setDartMatchResult({
          matched: false,
          summary: '일치하는 상장사 실공시 임원 팩트를 찾지 못했습니다 (비상장사 또는 미등기일 수 있습니다).'
        });
      }
      setIsDartChecking(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('이름을 입력해 주세요.');
      return;
    }

    const birthYear = birthYearStr ? parseInt(birthYearStr, 10) : undefined;
    let ageGroup: AgeGroup = '30s';
    let isAgeEstimated = true;

    if (birthYear && !isNaN(birthYear)) {
      const age = new Date().getFullYear() - birthYear;
      isAgeEstimated = false;
      if (age < 30) ageGroup = '20s';
      else if (age < 40) ageGroup = '30s';
      else if (age < 50) ageGroup = '40s';
      else ageGroup = '50s_plus';
    } else {
      const est = estimateAgeGroup(title, 2);
      ageGroup = est.ageGroup;
      isAgeEstimated = est.isEstimated;
    }

    // 학력 정보
    const academicsList = schoolName.trim() ? [
      {
        schoolName: schoolName.trim(),
        degree: '학사/석사',
        major: schoolMajor.trim(),
        graduationYear: birthYear ? birthYear + 26 : undefined,
        source: 'SOURCE_DATA' as const
      }
    ] : [];

    // 동아리
    const clubsList = clubName.trim() ? [clubName.trim()] : [];

    // 초기 인물 객체 생성
    let newPerson: Person = {
      id: `p_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      currentCompany: company.trim() || '미지정 회사',
      currentDepartment: department.trim(),
      currentTitle: title.trim() || '소속원',
      mobile: mobile.trim() || '010-0000-0000',
      email: email.trim() || `${name.toLowerCase()}@example.com`,
      birthday: birthday.trim() || undefined,
      birthYear,
      estimatedAgeGroup: ageGroup,
      isAgeEstimated,
      primaryDomain: domain,
      skills: clubName.trim() ? [domain, clubName.trim(), title].filter(Boolean) : [domain, title].filter(Boolean),
      careers: [
        {
          id: `cr_${Date.now()}_1`,
          companyName: company.trim() || '미지정 회사',
          department: department.trim(),
          title: title.trim() || '소속원',
          startYear: birthYear ? birthYear + 27 : 2022,
          isCurrent: true,
          source: 'SOURCE_DATA'
        }
      ],
      academics: academicsList,
      clubs: clubsList,
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'manual',
      isStale: false,
      memo: memo.trim() || '수동 인맥 등록'
    };

    // 알럼나이(전직 이력) 추가
    if (alumniCompany.trim()) {
      newPerson.careers.push({
        id: `cr_${Date.now()}_alumni`,
        companyName: alumniCompany.trim(),
        title: alumniTitle.trim() || '이전 직함',
        startYear: birthYear ? birthYear + 23 : 2016,
        endYear: birthYear ? birthYear + 27 : 2021,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      });
    }

    // DART 교차 검증 자동 적용
    const dartRes = crossCheckPersonWithDart(newPerson);
    if (dartRes.matched && dartRes.updatedPerson) {
      newPerson = dartRes.updatedPerson;
    }

    onSave(newPerson);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                소중한 동문 &amp; 인맥 직접 등록
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                학교, 전공, 회사, 생일 정보를 등록하면 그룹 주소록과 생일 알림에 자동 반영됩니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Name, Company, DART Check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                이름 (성명) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 최수연, 이해진, 김서연"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  현재 회사 / 소속 기관 <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleCheckDart}
                  disabled={isDartChecking}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>DART 공시 확인</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="예: NAVER, 카카오, 넥스트비전 AI"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* DART Match Alert Banner if checked */}
          {dartMatchResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              dartMatchResult.matched 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              <ShieldCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                dartMatchResult.matched ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`} />
              <div>
                <span className="font-bold block">
                  {dartMatchResult.matched ? '금융감독원 DART 실공시 팩트 확인됨' : 'DART 조회 결과'}
                </span>
                <span className="text-[11px] leading-relaxed">{dartMatchResult.summary}</span>
              </div>
            </div>
          )}

          {/* Row 2: Department & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">소속 부서 / 본부</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 기술총괄본부, AI R&D Center"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                현재 직함 / 직위 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 대표이사 (CEO), 이사, 본부장, 팀장"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">휴대전화 번호</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 4: Birthday, Birth Year, Primary Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                🎂 생일 (월-일, 예: 05-18)
              </label>
              <input
                type="text"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="예: 05-18 또는 11-25"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">출생년도 (선택 사항)</label>
              <input
                type="number"
                min="1940"
                max="2010"
                value={birthYearStr}
                onChange={(e) => setBirthYearStr(e.target.value)}
                placeholder="예: 1985 (생략 시 자동 추정)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">주요 전문 도메인</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="AI/LLM & Data">AI/LLM & Data</option>
                <option value="클라우드 & 인프라">클라우드 & 인프라</option>
                <option value="VC/PE 투자">VC/PE 투자</option>
                <option value="반도체/HW">반도체/HW</option>
                <option value="재무 & 전략/M&A">재무 & 전략/M&A</option>
                <option value="비즈니스 & 프로덕트">비즈니스 & 프로덕트</option>
                <option value="피플 & HR">피플 & HR</option>
              </select>
            </div>
          </div>

          {/* Row 5: School / Major (일반 회원 동문 특화) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>동문 학력 &amp; 동아리 정보 (학교/전공/취미 그룹 자동 매칭)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  출신 학교 (초/중/고/대)
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="예: 서울대학교, 경기고"
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  전공 / 학과
                </label>
                <input
                  type="text"
                  value={schoolMajor}
                  onChange={(e) => setSchoolMajor(e.target.value)}
                  placeholder="예: 컴퓨터공학, 경영학"
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  소속 동아리 / 소모임
                </label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="예: 락밴드, 골프회"
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Alumni (전직 이력) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>알럼나이(전직 이력) 추가 (과거 거쳐간 기업)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={alumniCompany}
                  onChange={(e) => setAlumniCompany(e.target.value)}
                  placeholder="과거 회사명 (예: 네이버, 삼성전자, 맥킨지)"
                  className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={alumniTitle}
                  onChange={(e) => setAlumniTitle(e.target.value)}
                  placeholder="당시 직함 (예: 수석연구원, 팀장)"
                  className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">인맥 메모 / 관계 맥락</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="예: 2026 동문회에서 만남, 차 한잔 나누기로 약속..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              취소
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>소중한 인맥 등록 완료</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
