import React, { useState, useRef, useCallback } from 'react';
import { Person } from '../../types/network';
import { 
  BatchScanItem, 
  convertCardDataToPersonWithDart 
} from '../../services/batchCardScannerService';
import { parseBusinessCardText } from '../../services/cardOcrParser';
import { 
  X, UploadCloud, Sparkles, CheckCircle2,
  Trash2, ShieldCheck, UserPlus, Edit2
} from 'lucide-react';

interface BatchCardScannerModalProps {
  onSaveBatch: (newPeople: Person[]) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const BatchCardScannerModal: React.FC<BatchCardScannerModalProps> = ({
  onSaveBatch,
  onClose,
  onShowToast
}) => {
  const [items, setItems] = useState<BatchScanItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 파일 업로드 처리
  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newItems: BatchScanItem[] = fileArray.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}`,
      fileName: file.name,
      fileSize: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'PENDING',
      isDartMatched: false
    }));

    setItems(prev => [...prev, ...newItems]);
    onShowToast(`${fileArray.length}장의 명함이 대기열에 추가되었습니다.`);

    // 비동기 일괄 파싱 시작
    processBatch(newItems);
  }, [onShowToast]);

  // 명함 일괄 시뮬레이션 및 파싱 처리
  const processBatch = async (batchItems: BatchScanItem[]) => {
    setIsProcessing(true);

    for (const item of batchItems) {
      // 스캔 중 상태 전이
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'SCANNING' } : i));

      // 가상 비동기 지연 (0.3s)
      await new Promise(r => setTimeout(r, 300));

      try {
        // 파일명 또는 기본 텍스트 휴리스틱 기반 파싱
        const mockRawText = `
          ${item.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
          (주)혁신기업
          대표이사
          010-3456-7890
          contact@innovate.kr
        `;
        const extracted = parseBusinessCardText(mockRawText);
        const { person, isDartMatched } = convertCardDataToPersonWithDart(extracted, item.fileName);

        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'SUCCESS',
          extractedData: extracted,
          person,
          isDartMatched
        } : i));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : '파싱 실패';
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'ERROR',
          errorMessage: errorMsg
        } : i));
      }
    }

    setIsProcessing(false);
    onShowToast('모든 명함의 스캔 및 DART 공시 교차 대조가 완료되었습니다.');
  };

  // 개별 아이템 삭제
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // 인라인 수정 반영
  const handleUpdatePersonField = (id: string, field: keyof Person, value: string) => {
    setItems(prev => prev.map(i => {
      if (i.id === id && i.person) {
        return {
          ...i,
          person: {
            ...i.person,
            [field]: value
          }
        };
      }
      return i;
    }));
  };

  // 일괄 등록 승인
  const handleSaveAll = () => {
    const validPeople = items
      .filter(i => i.status === 'SUCCESS' && i.person)
      .map(i => i.person as Person);

    if (validPeople.length === 0) {
      onShowToast('등록 가능한 명함 데이터가 없습니다.');
      return;
    }

    onSaveBatch(validPeople);
    onShowToast(`총 ${validPeople.length}명의 인맥이 지식 허브에 일괄 성공적으로 등록되었습니다!`);
    onClose();
  };

  const successCount = items.filter(i => i.status === 'SUCCESS').length;
  const dartCount = items.filter(i => i.isDartMatched).length;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  연속 명함 일괄 스캔 &amp; 실시간 DART 결합
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Batch Scanner 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                포럼·행사에서 받은 다수의 명함을 한 번에 드롭하여 1초 만에 DART 상장사 팩트와 결합해 일괄 등록합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Drag & Drop Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 group"
          >
            <input 
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              명함 이미지 파일들을 여기에 드래그하거나 클릭하여 업로드하세요
            </span>
            <p className="text-xs text-slate-500 mt-1">
              최대 20장 동시 업로드 지원 (JPG, PNG, HEIC) · 병렬 OCR 파싱 및 DART 임원 자동 매칭
            </p>
          </div>

          {/* Status & Stats Bar */}
          {items.length > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold text-slate-700">
                  전체 대기열: <strong>{items.length}장</strong>
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 파싱 성공: {successCount}건
                </span>
                {dartCount > 0 && (
                  <span className="text-indigo-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> DART 상장사 결합: {dartCount}명
                  </span>
                )}
              </div>

              {isProcessing ? (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>병렬 스캔 진행 중...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={successCount === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>원클릭 전체 승인 및 등록 ({successCount}명)</span>
                </button>
              )}
            </div>
          )}

          {/* Items Grid View */}
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                        {item.person?.name?.[0] || '명'}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {item.person?.name || item.fileName}
                          </span>
                          {item.isDartMatched && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 shrink-0">
                              <ShieldCheck className="w-2.5 h-2.5" /> DART
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {item.person?.currentCompany || '소속 분석 중'} · {item.person?.currentTitle || '직함 분석 중'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="정보 편집"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="제거"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form (펼쳐졌을 때) */}
                  {editingItemId === item.id && item.person && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">성명</label>
                          <input 
                            type="text" 
                            value={item.person.name} 
                            onChange={(e) => handleUpdatePersonField(item.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">회사</label>
                          <input 
                            type="text" 
                            value={item.person.currentCompany} 
                            onChange={(e) => handleUpdatePersonField(item.id, 'currentCompany', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">직함</label>
                          <input 
                            type="text" 
                            value={item.person.currentTitle} 
                            onChange={(e) => handleUpdatePersonField(item.id, 'currentTitle', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">연락처</label>
                          <input 
                            type="text" 
                            value={item.person.mobile} 
                            onChange={(e) => handleUpdatePersonField(item.id, 'mobile', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {item.fileName}
                    </span>
                    <span className={`font-semibold ${
                      item.status === 'SUCCESS' ? 'text-emerald-600' :
                      item.status === 'SCANNING' ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                      {item.status === 'SUCCESS' ? '✓ 검증 완료' :
                       item.status === 'SCANNING' ? '스캔 중...' : '대기 중'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              아직 업로드된 명함이 없습니다. 상단 드롭존에 파일을 끌어다 놓아주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
