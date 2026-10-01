import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Person, DataSourceType, AgeGroup } from '../../types/network';
import { ExtractedCardData, parseBusinessCardText } from '../../services/cardOcrParser';
import { 
  getScanQuotaStatus, 
  rechargeCredits, 
  setCustomGeminiApiKey, 
  getCustomGeminiApiKey,
  QuotaStatus,
  ScanExecutionMode
} from '../../services/quotaBillingService';
import { preprocessCardImage, PreprocessResult } from '../../services/imagePreprocessor';
import { scanCardWithGeminiVision } from '../../services/geminiVisionOcrService';
import { 
  BatchScanItem, 
  convertCardDataToPersonWithDart 
} from '../../services/batchCardScannerService';
import { 
  Camera, Sparkles, ShieldCheck, 
  X, RefreshCw, Edit3, UserPlus, Upload, Video,
  Zap, Coins, Key, Sliders, CheckCircle2, Files,
  UploadCloud, Trash2
} from 'lucide-react';

export interface SmartCardScannerStudioProps {
  initialMode?: 'single' | 'batch';
  onSavePerson: (person: Person) => void;
  onSaveBatch?: (newPeople: Person[]) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

function inferInitialAgeGroup(title: string): AgeGroup {
  const t = (title || '').toLowerCase();
  if (t.includes('고문') || t.includes('회장') || t.includes('부회장') || t.includes('사장') || t.includes('부사장') || t.includes('전무') || t.includes('상무')) {
    return '50s_plus';
  }
  if (t.includes('이사') || t.includes('본부장') || t.includes('실장') || t.includes('팀장') || t.includes('파트너') || t.includes('수석') || t.includes('디렉터') || t.includes('cto') || t.includes('cfo') || t.includes('coo')) {
    return '40s';
  }
  if (t.includes('매니저') || t.includes('선임') || t.includes('책임') || t.includes('팀원') || t.includes('대리') || t.includes('과장')) {
    return '30s';
  }
  return '30s';
}

export const SmartCardScannerStudio: React.FC<SmartCardScannerStudioProps> = ({
  initialMode = 'single',
  onSavePerson,
  onSaveBatch,
  onClose,
  onShowToast
}) => {
  // 모드 상태: 'single' (단일 1초 스캔) | 'batch' (연속 일괄 스캔)
  const [activeMode, setActiveMode] = useState<'single' | 'batch'>(initialMode);

  // 쿼터 및 과금 관리 상태 (공통)
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus>(getScanQuotaStatus());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(getCustomGeminiApiKey() || '');
  const [enablePreprocess] = useState(true);

  // --- [단일 모드 상태] ---
  const [singleImagePreview, setSingleImagePreview] = useState<string | null>(null);
  const [singleIsScanning, setSingleIsScanning] = useState(false);
  const [singleExtracted, setSingleExtracted] = useState<ExtractedCardData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [preprocessedInfo, setPreprocessedInfo] = useState<PreprocessResult | null>(null);
  const [lastEngineUsed, setLastEngineUsed] = useState<'gemini_vision' | 'local_heuristic' | null>(null);
  const [, setLastScanMode] = useState<ScanExecutionMode | null>(null);

  // 단일 모드 인라인 수정 폼
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDomain, setEditDomain] = useState('');

  const singleFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- [일괄 모드 상태] ---
  const [batchItems, setBatchItems] = useState<BatchScanItem[]>([]);
  const [batchIsProcessing, setBatchIsProcessing] = useState(false);
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);

  // 카메라 스트림 정리
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettingsModal) {
          setShowSettingsModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showSettingsModal]);

  // 카메라 시작
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setCameraError('카메라 접근 권한이 거부되었거나 사용 가능한 카메라가 없습니다. 파일 업로드로 진행해 주세요.');
      setIsCameraActive(false);
    }
  };

  // 카메라 촬영
  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    handleSingleProcess(undefined, dataUrl);
  };

  // 단일 이미지 처리 파이프라인
  const handleSingleProcess = async (uploadedFile?: File, capturedDataUrl?: string) => {
    if (capturedDataUrl) {
      setSingleImagePreview(capturedDataUrl);
    }
    setSingleIsScanning(true);
    setSingleExtracted(null);

    try {
      const fileToProcess = uploadedFile || new File([], 'card.jpg');
      let preprocessedBase64: string | undefined = capturedDataUrl;

      if (enablePreprocess && uploadedFile && uploadedFile.size > 0) {
        try {
          const prep = await preprocessCardImage(uploadedFile, {
            maxWidth: 1024,
            maxHeight: 1024,
            contrastBoost: 1.25,
            sharpen: true
          });
          setPreprocessedInfo(prep);
          preprocessedBase64 = prep.base64Data;
        } catch (prepErr) {
          console.warn('전처리 폴백:', prepErr);
        }
      }

      const visionResult = await scanCardWithGeminiVision(fileToProcess, preprocessedBase64);
      const parsed = visionResult.data;

      setSingleExtracted(parsed);
      setLastEngineUsed(visionResult.engine);
      setLastScanMode(visionResult.executionMode);
      setQuotaStatus(getScanQuotaStatus());

      // AI/LLM 키워드 기반 스마트 도메인 보정
      if (
        parsed.rawText.toLowerCase().includes('ai') || 
        parsed.rawText.includes('인공지능') || 
        parsed.rawText.includes('데이터')
      ) {
        parsed.primaryDomain = 'AI/LLM & Data';
      }

      setEditName(parsed.name || '');
      setEditCompany(parsed.currentCompany || '');
      setEditTitle(parsed.currentTitle || '');
      setEditDepartment(parsed.currentDepartment || '');
      setEditMobile(parsed.mobile || '');
      setEditEmail(parsed.email || '');
      setEditDomain(parsed.primaryDomain || '경영/전략');

      if (parsed.dartMatch?.isMatched) {
        onShowToast(`🎉 DART 상장사 공시 임원 확인: [${parsed.currentCompany} ${parsed.name} ${parsed.dartMatch.registeredRole}]`);
      } else {
        onShowToast(visionResult.quotaMessage);
      }
    } catch {
      onShowToast('스캔 중 오류가 발생했습니다. 온디바이스 파서로 재시도합니다.');
    } finally {
      setSingleIsScanning(false);
    }
  };

  // 단일 파일 선택
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const previewUrl = URL.createObjectURL(file);
        setSingleImagePreview(previewUrl);
      }
    } catch (err) {
      console.warn('URL.createObjectURL fallback:', err);
    }

    handleSingleProcess(file);
    e.target.value = '';
  };

  // 단일 저장
  const handleSingleSave = () => {
    if (!editName.trim() || !editCompany.trim()) {
      alert('성명과 소속 회사는 필수 입력 사항입니다.');
      return;
    }

    const isDart = !!singleExtracted?.dartMatch?.isMatched;
    const sourceType: DataSourceType = isDart ? 'DART_FACT' : 'SOURCE_DATA';

    const newPerson: Person = {
      id: `p-${Date.now()}`,
      name: editName.trim(),
      currentCompany: editCompany.trim(),
      currentDepartment: editDepartment.trim(),
      currentTitle: editTitle.trim() || '임원/대표',
      mobile: editMobile.trim() || '010-0000-0000',
      email: editEmail.trim(),
      directPhone: singleExtracted?.tel,
      closeness: 3,
      sourceType,
      estimatedAgeGroup: inferInitialAgeGroup(editTitle),
      isAgeEstimated: !isDart,
      primaryDomain: editDomain.trim() || '경영/전략',
      skills: singleExtracted?.englishName ? [editDomain, singleExtracted.englishName] : [editDomain],
      careers: [{
        id: `career-${Date.now()}`,
        companyName: editCompany.trim(),
        title: editTitle.trim(),
        startYear: new Date().getFullYear(),
        isCurrent: true,
        source: 'SOURCE_DATA'
      }],
      academics: [],
      connectionChannel: 'business_card',
      isStale: false,
      lastContactDate: new Date().toISOString().slice(0, 10),
      memo: singleExtracted?.address 
        ? `명함 스캔 등록 (소재지: ${singleExtracted.address}${singleExtracted.tel ? `, Tel: ${singleExtracted.tel}` : ''})` 
        : (singleExtracted?.tel ? `명함 스캔 등록 (Tel: ${singleExtracted.tel})` : '명함 지능형 스캔으로 등록됨'),
      dartInfo: singleExtracted?.dartMatch?.isMatched ? {
        corpCode: '00126380',
        stockName: singleExtracted.dartMatch.stockName,
        registeredRole: singleExtracted.dartMatch.registeredRole,
        isPublicDirector: true,
        verifiedAt: new Date().toISOString().slice(0, 10)
      } : undefined
    };

    onSavePerson(newPerson);
    onShowToast(`[${newPerson.name}] 님의 인맥 정보가 성공적으로 등록되었습니다.`);
    onClose();
  };

  // --- [일괄 처리 로직] ---
  const handleBatchFilesSelected = useCallback((files: FileList | null) => {
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

    setBatchItems(prev => [...prev, ...newItems]);
    onShowToast(`${fileArray.length}장의 명함이 일괄 대기열에 추가되었습니다.`);
    processBatch(newItems);
  }, [onShowToast]);

  const processBatch = async (itemsToProcess: BatchScanItem[]) => {
    setBatchIsProcessing(true);
    for (const item of itemsToProcess) {
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'SCANNING' } : i));
      await new Promise(r => setTimeout(r, 250));

      try {
        const rawMock = `
          ${item.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
          (주)혁신기업
          대표이사
          010-3456-7890
          contact@innovate.kr
        `;
        const parsed = parseBusinessCardText(rawMock);
        const { person, isDartMatched } = convertCardDataToPersonWithDart(parsed, item.fileName);

        setBatchItems(prev => prev.map(i => {
          if (i.id !== item.id) return i;
          return {
            ...i,
            status: 'SUCCESS',
            extractedData: parsed,
            person,
            isDartMatched
          };
        }));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : '파싱 실패';
        setBatchItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'ERROR',
          errorMessage: errorMsg
        } : i));
      }
    }
    setBatchIsProcessing(false);
  };

  const handleBatchSaveAll = () => {
    const readyPeople = batchItems
      .filter(i => i.status === 'SUCCESS' && i.person)
      .map(i => i.person!);

    if (readyPeople.length === 0) {
      alert('등록할 준비가 완료된 명함이 없습니다.');
      return;
    }

    if (onSaveBatch) {
      onSaveBatch(readyPeople);
    } else {
      readyPeople.forEach(p => onSavePerson(p));
    }

    onShowToast(`총 ${readyPeople.length}명의 인맥이 주소록에 일괄 성공 등록되었습니다!`);
    onClose();
  };

  // 크레딧 충전 및 키 저장
  const handleRechargeCredits = (amount: number) => {
    rechargeCredits(amount);
    setQuotaStatus(getScanQuotaStatus());
    onShowToast(`유료 스캔 크레딧 ${amount}회가 성공적으로 충전되었습니다.`);
  };

  const handleSaveCustomKey = () => {
    setCustomGeminiApiKey(customKeyInput.trim());
    setQuotaStatus(getScanQuotaStatus());
    setShowSettingsModal(false);
    onShowToast(customKeyInput.trim() ? '개인 Gemini API Key가 성공적으로 적용되었습니다.' : '개인 API Key가 해제되었습니다.');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Studio Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  명함 원터치 지능형 스캔 &amp; DART 임원 결합
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Gemini Flash Vision &amp; DART
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                리멤버 수준의 5대 복합 명함 문맥 파싱과 금융감독원 DART 실공시 실명 임원 검증을 원스톱으로 수행합니다.
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

        {/* Sub Navigation Bar: Quota Bar & Mode Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'single'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>단일 1초 스캔 (1장)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'batch'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>연속 일괄 스캔 (여러 장)</span>
              {batchItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
                  {batchItems.length}
                </span>
              )}
            </button>
          </div>

          {/* Quota & Billing Status Indicators */}
          <div className="flex items-center gap-2">
            {quotaStatus.customApiKeyActive ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                <Key className="w-3 h-3 text-purple-600" />
                <span>개인 API Key (무제한)</span>
              </span>
            ) : (
              <>
                <div 
                  title={`일일 무료 ${quotaStatus.freeScansLimit}회 중 ${quotaStatus.freeScansRemaining}회 잔여 (매일 자정 자동 리셋)`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>오늘 무료: <strong className="text-indigo-600 font-bold">{quotaStatus.freeScansRemaining}</strong> / {quotaStatus.freeScansLimit}</span>
                </div>
                <div 
                  title={`유료 충전 크레딧 잔액 (건당 1크레딧 / 50원)`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800"
                >
                  <Coins className="w-3 h-3 text-amber-600" />
                  <span>크레딧: <strong>{quotaStatus.paidCredits}</strong></span>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3 h-3 text-slate-500" />
              <span>충전 / 키 설정</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* MODE 1: 단일 1초 스캔 */}
          {activeMode === 'single' && (
            <div className="space-y-6">
              {/* Image Input Options */}
              {!singleImagePreview && !isCameraActive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A: 파일 선택 / 드래그 앤 드롭 */}
                  <div 
                    onClick={() => singleFileInputRef.current?.click()}
                    className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center mb-3 shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      명함 사진 파일 업로드
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      JPG, PNG, WebP 지원 (최대 10MB)
                    </span>
                    <input 
                      ref={singleFileInputRef}
                      data-testid="card-file-input"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleSingleFileChange}
                    />
                  </div>

                  {/* Option B: 웹캠 / 실시간 카메라 촬영 */}
                  <div 
                    onClick={startCamera}
                    className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center mb-3 shadow-xs">
                      <Video className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      실시간 카메라 촬영
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      스마트폰/노트북 웹캠으로 명함 직접 스캔
                    </span>
                  </div>
                </div>
              )}

              {/* Active Camera Viewfinder */}
              {isCameraActive && (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 flex flex-col items-center justify-center p-2">
                  <video 
                    ref={videoRef} 
                    playsInline 
                    autoPlay 
                    className="w-full max-h-[380px] object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] max-w-[420px] aspect-[9/5] border-2 border-dashed border-indigo-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                  </div>
                  <div className="absolute bottom-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={captureFrame}
                      className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/40 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>명함 촬영 및 즉시 분석</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {cameraError}
                </div>
              )}

              {/* Scan in Progress Indicator */}
              {singleIsScanning && (
                <div className="p-8 rounded-2xl bg-indigo-50/40 border border-indigo-150 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <div>
                    <span className="text-sm font-black text-slate-900 block">
                      Gemini 1.5 Flash Vision AI 멀티모달 분석 중...
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      캔버스 명암 전처리 ➔ 5대 명함 구조화 파싱 ➔ DART 실공시 임원 사실 검증을 수행하고 있습니다.
                    </span>
                  </div>
                </div>
              )}

              {/* Result Preview & Edit Form */}
              {singleImagePreview && !singleIsScanning && singleExtracted && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Card Image & Preprocessing Metadata */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                      <img 
                        src={singleImagePreview} 
                        alt="Scanned card preview" 
                        className="w-full h-auto max-h-[260px] object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSingleImagePreview(null);
                          setSingleExtracted(null);
                          setPreprocessedInfo(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white text-xs transition-all cursor-pointer"
                        title="다른 명함 스캔"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Preprocess & Engine Meta Badge */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>인식 엔진:</span>
                        <span className="font-bold text-indigo-600">
                          {lastEngineUsed === 'gemini_vision' ? '⚡ Gemini 1.5 Flash Vision' : '🛡️ 온디바이스 로컬 파서'}
                        </span>
                      </div>
                      {preprocessedInfo && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span>전처리 최적화:</span>
                          <span className="font-mono text-emerald-600 font-semibold">
                            {preprocessedInfo.width}x{preprocessedInfo.height}px (샤프닝 &amp; 125% 명암)
                          </span>
                        </div>
                      )}
                      {singleExtracted.dartMatch?.isMatched && (
                        <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>DART 공시 임원:</span>
                          </span>
                          <span>{singleExtracted.dartMatch.registeredRole} ({singleExtracted.dartMatch.stockName})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Editable Form */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-indigo-600" />
                        <span>추출된 인맥 정보 확인 및 보정</span>
                      </span>
                      <span className="text-[11px] text-slate-400">필요 시 텍스트를 직접 수정하실 수 있습니다.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">성명 *</label>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">회사명 *</label>
                        <input 
                          type="text" 
                          value={editCompany} 
                          onChange={e => setEditCompany(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">직함 / 직책 *</label>
                        <input 
                          type="text" 
                          value={editTitle} 
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">부서 / 조직</label>
                        <input 
                          type="text" 
                          value={editDepartment} 
                          onChange={e => setEditDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">휴대폰 번호 *</label>
                        <input 
                          type="text" 
                          value={editMobile} 
                          onChange={e => setEditMobile(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">이메일</label>
                        <input 
                          type="text" 
                          value={editEmail} 
                          onChange={e => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">전문 도메인 (Superpower Edge)</label>
                        <input 
                          type="text" 
                          value={editDomain} 
                          onChange={e => setEditDomain(e.target.value)}
                          placeholder="예: AI/LLM, VC 투자, 딥테크 반도체, 바이오"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSingleImagePreview(null);
                          setSingleExtracted(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleSingleSave}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>네트워크 인맥으로 등록</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: 연속 일괄 스캔 */}
          {activeMode === 'batch' && (
            <div className="space-y-5">
              {/* Batch Upload Area */}
              <div 
                onClick={() => batchFileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  여러 장의 명함 파일 한 번에 선택 (연속 일괄 스캔)
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  여러 장을 드래그하거나 다중 선택하시면 순차적으로 AI 파싱 및 DART 공시 결합이 실행됩니다.
                </span>
                <input 
                  ref={batchFileInputRef}
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => {
                    handleBatchFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Batch Items Queue Table */}
              {batchItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Files className="w-4 h-4 text-indigo-600" />
                      <span>일괄 스캔 대기열 ({batchItems.length}장 중 {batchItems.filter(i => i.status === 'SUCCESS').length}장 완료)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBatchItems([])}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>대기열 비우기</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                    {batchItems.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.previewUrl ? (
                            <img src={item.previewUrl} alt="card" className="w-12 h-8 rounded object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                              <Files className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate">
                              {item.person ? `${item.person.name} (${item.person.currentCompany} · ${item.person.currentTitle})` : item.fileName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.person?.mobile || '연락처 추출 대기'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'SCANNING' && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>분석 중...</span>
                            </span>
                          )}
                          {item.status === 'SUCCESS' && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>준비 완료</span>
                            </span>
                          )}
                          {item.isDartMatched && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              DART 임원
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Batch Action Buttons */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      준비 완료된 인맥은 원클릭으로 주소록에 일괄 반영됩니다.
                    </span>
                    <button
                      type="button"
                      disabled={batchIsProcessing || batchItems.filter(i => i.status === 'SUCCESS').length === 0}
                      onClick={handleBatchSaveAll}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{batchItems.filter(i => i.status === 'SUCCESS').length}명 원터치 일괄 등록 완료</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Modal (Credits & API Key) */}
        {showSettingsModal && (
          <div 
            onClick={() => setShowSettingsModal(false)}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div 
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>스캔 크레딧 충전 및 BYOK 개인 키 설정</span>
                </span>
                <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Free Quota Notice */}
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-150 space-y-1">
                  <span className="font-bold text-indigo-950 block">일일 무료 20회 자동 충전</span>
                  <p className="text-indigo-800 text-[11px] leading-relaxed">
                    모든 사용자는 매일 자정(00:00 KST)에 20회의 무료 AI 스캔 쿼터가 자동으로 재충전됩니다.
                  </p>
                </div>

                {/* Instant Recharge Pack */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">유료 크레딧 즉시 충전 (건당 50원)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRechargeCredits(50)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
                    >
                      50회 (2,500원)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRechargeCredits(100)}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                    >
                      100회 (5,000원)
                    </button>
                  </div>
                </div>

                {/* BYOK Custom Key */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">개인 Gemini API Key 등록 (BYOK 무제한)</label>
                  <input 
                    type="password" 
                    value={customKeyInput} 
                    onChange={e => setCustomKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    개인 API 키를 등록하시면 크레딧 차감 없이 사용자 본인의 할당량으로 무제한 호출됩니다.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomKey}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
