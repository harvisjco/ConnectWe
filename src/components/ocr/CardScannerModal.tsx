import React, { useState, useRef } from 'react';
import { Person, DataSourceType } from '../../types/network';
import { 
  parseBusinessCardText, 
  simulateExtractCardTextFromImage, 
  ExtractedCardData 
} from '../../services/cardOcrParser';
import { 
  Camera, Sparkles, ShieldCheck, 
  X, RefreshCw, Edit3, UserPlus 
} from 'lucide-react';

interface CardScannerModalProps {
  onSavePerson: (person: Person) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const CardScannerModal: React.FC<CardScannerModalProps> = ({
  onSavePerson,
  onClose,
  onShowToast
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedCardData | null>(null);

  // 인라인 수정 폼 상태
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDomain, setEditDomain] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 파일 선택 및 스캔 트리거
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기 생성
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsScanning(true);

    try {
      // 1. OCR 텍스트 추출 (Zero-Retention)
      const rawText = await simulateExtractCardTextFromImage(file);
      // 2. 지능형 정규식 및 DART 실시간 교차검증
      const parsed = parseBusinessCardText(rawText);

      setExtracted(parsed);
      setEditName(parsed.name);
      setEditCompany(parsed.currentCompany);
      setEditTitle(parsed.currentTitle);
      setEditDepartment(parsed.currentDepartment || '');
      setEditMobile(parsed.mobile);
      setEditEmail(parsed.email);
      setEditDomain(parsed.primaryDomain);

      if (parsed.dartMatch?.isMatched) {
        onShowToast(`🎉 [${parsed.dartMatch.stockName}] DART 상장사 공시 임원 매칭이 확인되었습니다!`);
      } else {
        onShowToast('명함 텍스트가 성공적으로 파싱되었습니다.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      onShowToast('명함 스캔 중 오류가 발생했습니다.');
    } finally {
      setIsScanning(false);
      // PIPA 준수: 미리보기 Blob 메모리 즉시 안전 해제
      setTimeout(() => URL.revokeObjectURL(previewUrl), 1000);
    }
  };

  // 인맥 최종 저장
  const handleSave = () => {
    if (!editName.trim() || !editCompany.trim()) {
      alert('이름과 회사명은 필수입니다.');
      return;
    }

    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name: editName.trim(),
      currentCompany: editCompany.trim(),
      currentTitle: editTitle.trim(),
      currentDepartment: editDepartment.trim() || '',
      mobile: editMobile.trim(),
      email: editEmail.trim(),
      primaryDomain: editDomain.trim() || '경영/전략',
      sourceType: extracted?.dartMatch?.isMatched ? ('DART_FACT' as DataSourceType) : ('SOURCE_DATA' as DataSourceType),
      closeness: 3,
      isStale: false,
      lastContactDate: new Date().toISOString().slice(0, 10),
      memo: '종이 명함 카메라 OCR 스캔으로 등록됨',
      skills: [editDomain],
      careers: [{
        id: `career-${Date.now()}`,
        companyName: editCompany.trim(),
        title: editTitle.trim(),
        startYear: new Date().getFullYear(),
        isCurrent: true,
        source: 'SOURCE_DATA'
      }],
      academics: [],
      estimatedAgeGroup: '40s',
      isAgeEstimated: true,
      connectionChannel: 'business_card',
      dartInfo: extracted?.dartMatch?.isMatched ? {
        corpCode: '00126380',
        stockName: extracted.dartMatch.stockName,
        registeredRole: extracted.dartMatch.registeredRole,
        isPublicDirector: true,
        verifiedAt: new Date().toISOString().slice(0, 10)
      } : undefined
    };

    onSavePerson(newPerson);
    onShowToast(`[${newPerson.name}] 님이 인맥 은하수에 성공적으로 등록되었습니다.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                명함 1초 OCR 스캔 &amp; DART 임원 결합
              </h2>
              <p className="text-[11px] text-slate-400">온디바이스 비전 AI · Zero-Retention 메모리 보안</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Card Viewfinder / Upload Area */}
          {!extracted && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/60 group overflow-hidden"
            >
              {/* 스캔 중 레이저 애니메이션 바 */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-lg shadow-emerald-400" style={{ top: '50%' }} />
              )}

              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Card Preview"
                  className="max-h-48 object-contain rounded-xl shadow-lg border border-slate-700 mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Camera className="w-8 h-8 text-indigo-400" />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-sm font-bold text-white">
                  {isScanning ? '온디바이스 텍스트 추출 & DART 공시 대조 중...' : '명함 사진을 찍거나 드래그해 놓으세요'}
                </span>
                <p className="text-slate-400 text-xs">
                  JPG, PNG, HEIC 명함 이미지 지원 (클라이언트 메모리에서 즉시 분석 후 파기)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Extracted & Inline Quick Editor */}
          {extracted && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* DART Match Status Banner */}
              {extracted.dartMatch?.isMatched ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                      <span>금융감독원 DART 상장사 공시 임원 일치 확인</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-mono">
                        DART FACT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      [{extracted.dartMatch.stockName}]의 공시 등기임원({extracted.dartMatch.registeredRole})으로 자동 검증되어 은하수 노드에 각인됩니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>DART 공시 임원 미해당 (일반 주소록 인맥으로 지식 허브에 등록됩니다).</span>
                </div>
              )}

              {/* Inline Quick Editor Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    추출 정보 확인 및 인라인 퀵 에디터
                  </span>
                  <button
                    onClick={() => {
                      setExtracted(null);
                      setImagePreview(null);
                    }}
                    className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> 다시 스캔
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">이름</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">회사명</label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">직함 / 직책</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">소속 부서</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">휴대전화</label>
                    <input
                      type="text"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">이메일</label>
                    <input
                      type="text"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>인맥 은하수에 등록</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
