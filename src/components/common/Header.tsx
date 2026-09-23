import React, { useRef } from 'react';
import { Person } from '../../types/network';
import { exportPeopleToVcf } from '../../services/vcardExporter';
import { exportBackupJson, restoreBackupFromJson, resetStorage } from '../../services/storageService';
import { batchCrossCheckWithDart } from '../../services/dartFactEngine';
import { pickContactsFromDevice } from '../../services/contactPicker';
import { 
  Share2, UploadCloud, Download, ShieldCheck, Clock, 
  Users, UserPlus, FileDown, RotateCcw, Sparkles, Smartphone
} from 'lucide-react';

interface HeaderProps {
  people: Person[];
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
  onOpenDigestModal: () => void;
  onUpdatePeople: (people: Person[]) => void;
  onShowToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  people, 
  onOpenImportModal, 
  onOpenAddModal,
  onOpenDigestModal,
  onUpdatePeople,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dartFactCount = people.filter(p => p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector).length;
  const staleCount = people.filter(p => p.isStale).length;

  // CSV 다운로드 (BOM \uFEFF 필수 적용)
  const handleExportCsv = () => {
    const headers = ['이름', '현재회사', '현재직함', '소속부서', '휴대전화', '이메일', '출처구분', '추정나이대', 'DART상장공시', '소통단절여부', '메모'];
    const rows = people.map(p => [
      `"${p.name}"`,
      `"${p.currentCompany}"`,
      `"${p.currentTitle}"`,
      `"${p.currentDepartment || ''}"`,
      `"${p.mobile}"`,
      `"${p.email}"`,
      `"${p.sourceType}"`,
      `"${p.estimatedAgeGroup}"`,
      `"${p.dartInfo ? p.dartInfo.stockName : '해당없음'}"`,
      `"${p.isStale ? '6개월이상 미소통' : '최근소통'}"`,
      `"${(p.memo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ConnectWe_Contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('UTF-8 with BOM 형식으로 엑셀 한글 호환 CSV 파일이 내보내졌습니다.');
  };

  // vCard (.vcf) 전체 내보내기
  const handleExportVcf = () => {
    exportPeopleToVcf(people);
    onShowToast(`총 ${people.length}명의 스마트폰 주소록(.vcf) 파일이 다운로드되었습니다.`);
  };

  // DART 일괄 교차검증 스캔
  const handleBatchDartCheck = () => {
    const { updatedPeople, newlyVerifiedCount } = batchCrossCheckWithDart(people);
    onUpdatePeople(updatedPeople);
    if (newlyVerifiedCount > 0) {
      onShowToast(`DART 8,500+ 기업 DB 매칭 완료: 신규 ${newlyVerifiedCount}명이 공시 팩트로 승격되었습니다!`);
    } else {
      onShowToast('DART 교차 검증 완료: 이미 모든 상장사 임원이 동기화되어 있습니다.');
    }
  };

  // 백업 파일 복원 핸들러
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupFromJson(content);
      if (res.success) {
        onUpdatePeople(res.people);
        onShowToast(res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // 초기 상태 리셋
  const handleReset = () => {
    if (confirm('로컬에 저장된 인맥 데이터를 초기 시드 상태로 리셋하시겠습니까?')) {
      const initial = resetStorage();
      onUpdatePeople(initial);
      onShowToast('인맥 데이터가 기본 시드 상태로 초기화되었습니다.');
    }
  };

  // 모바일 단말기 주소록 직접 가져오기 (Contact Picker API)
  const handleDeviceContacts = async () => {
    const res = await pickContactsFromDevice();
    if (!res.supported) {
      onOpenImportModal();
      return;
    }
    if (res.people.length > 0) {
      onUpdatePeople([...res.people, ...people]);
      onShowToast(`스마트폰 주소록에서 ${res.people.length}명의 연락처가 직접 연동되었습니다.`);
    } else if (res.errorMessage) {
      onShowToast(res.errorMessage);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ConnectWe
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wide">
                Production-Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              리멤버 · 스마트폰 주소록 · DART 8,500+ 상장사 실공시 팩트 융합 인맥 허브
            </p>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">총 인맥:</span>
            <span className="font-bold text-white">{people.length}명</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">DART FACT:</span>
            <span className="font-bold text-emerald-300">{dartFactCount}명</span>
          </div>

          {/* Daily Intelligence Digest Trigger Button */}
          <button
            onClick={onOpenDigestModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 hover:border-indigo-400 text-xs font-semibold text-indigo-300 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>오늘의 다이제스트</span>
            {staleCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-500" />
            )}
          </button>

          {staleCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">미소통:</span>
              <span className="font-bold text-amber-300">{staleCount}명</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* DART Scan */}
            <button
              onClick={handleBatchDartCheck}
              title="8,500+ DART 상장사 공시 임원 일괄 교차 검증"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>DART 스캔</span>
            </button>

            {/* Add Person */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>인맥 등록</span>
            </button>

            {/* Mobile Contact Picker */}
            <button
              onClick={handleDeviceContacts}
              title="스마트폰 주소록 직접 선택 동기화 (Contact Picker API)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>폰 주소록</span>
            </button>

            {/* Import Contacts */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>가져오기</span>
            </button>

            {/* vCard (.vcf) Export */}
            <button
              onClick={handleExportVcf}
              title="스마트폰 연락처 파일(.vcf)로 다운로드"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>.vcf</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCsv}
              title="UTF-8 with BOM Excel 호환 CSV 다운로드"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Backup JSON */}
            <button
              onClick={exportBackupJson}
              title="전체 인맥 및 소통 로그 백업 JSON 다운로드"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>

            {/* Restore JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="백업 JSON 파일 복원"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileRestore}
            />

            {/* Reset */}
            <button
              onClick={handleReset}
              title="기본 시드 상태로 초기화"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
