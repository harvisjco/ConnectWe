import React from 'react';
import { Person } from '../../types/network';
import { Share2, UploadCloud, Download, ShieldCheck, Clock, Users } from 'lucide-react';

interface HeaderProps {
  people: Person[];
  onOpenImportModal: () => void;
  onSelectPerson: (person: Person) => void;
}

export const Header: React.FC<HeaderProps> = ({ people, onOpenImportModal }) => {
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
    link.setAttribute('download', `ConnectWe_Network_Contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                GraphRAG Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">
              리멤버 · 스마트폰 주소록 · DART 상장사 공시 임원 팩트 융합 인맥 지능
            </p>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
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

          {staleCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">소통 리마인더:</span>
              <span className="font-bold text-amber-300">{staleCount}명</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>연락처 가져오기</span>
            </button>

            <button
              onClick={handleExportCsv}
              title="UTF-8 with BOM 형식으로 엑셀 한글 깨짐 없이 내보냅니다"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
