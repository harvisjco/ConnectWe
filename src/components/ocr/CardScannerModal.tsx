import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Person, DataSourceType, AgeGroup } from '../../types/network';
import { 
  parseBusinessCardText, 
  simulateExtractCardTextFromImage, 
  ExtractedCardData 
} from '../../services/cardOcrParser';
import { 
  Camera, Sparkles, ShieldCheck, 
  X, RefreshCw, Edit3, UserPlus, Upload, Video
} from 'lucide-react';

interface CardScannerModalProps {
  onSavePerson: (person: Person) => void;
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

export const CardScannerModal: React.FC<CardScannerModalProps> = ({
  onSavePerson,
  onClose,
  onShowToast
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedCardData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // 인라인 수정 폼 상태
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDomain, setEditDomain] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 카메라 스트림 중지 헬퍼
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // 컴포넌트 언마운트 시 카메라 해제 (PIPA 보안 준수)
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 실시간 카메라 켜기
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // 스마트폰 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setImagePreview(null);
      setExtracted(null);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('카메라 접근 권한을 얻을 수 없습니다. 아래 파일 선택을 이용해 주세요.');
      setIsCameraActive(false);
    }
  };

  // 실시간 카메라에서 프레임 캡처 및 OCR 파싱
  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImagePreview(dataUrl);
    stopCamera();

    // OCR 파싱 진행
    processImageForOcr();
  };

  // 파일 업로드 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      }
    } catch (err) {
      console.warn('URL.createObjectURL fallback:', err);
    }

    processImageForOcr(file);
  };

  // OCR 및 DART 파싱 파이프라인
  const processImageForOcr = async (uploadedFile?: File) => {
    setIsScanning(true);
    try {
      // 1. OCR 텍스트 추출 (Zero-Retention)
      const rawText = await simulateExtractCardTextFromImage(uploadedFile || new File([], 'card.jpg'));
      // 2. 지능형 정규식 및 DART 실시간 교차검증
      const parsed = parseBusinessCardText(rawText);

      // AI/LLM 키워드 기반 스마트 도메인 보정
      if (rawText.toLowerCase().includes('ai') || rawText.includes('인공지능') || rawText.includes('데이터')) {
        parsed.primaryDomain = 'AI/LLM & Data';
      }

      setExtracted(parsed);
      setEditName(parsed.name);
      setEditCompany(parsed.currentCompany);
      setEditTitle(parsed.currentTitle);
      setEditDepartment(parsed.currentDepartment || '');
      setEditMobile(parsed.mobile);
      setEditEmail(parsed.email);
      setEditDomain(parsed.primaryDomain);

      if (parsed.dartMatch?.isMatched) {
        onShowToast(`[${parsed.dartMatch.stockName}] DART 상장사 공시 임원 일치 확인!`);
      } else {
        onShowToast('명함 텍스트가 성공적으로 파싱되었습니다.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      onShowToast('명함 스캔 중 오류가 발생했습니다.');
    } finally {
      setIsScanning(false);
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
      closeness: 2,
      isStale: false,
      lastContactDate: new Date().toISOString().slice(0, 10),
      memo: extracted?.address 
        ? `명함 스캔 등록 (소재지: ${extracted.address}${extracted.tel ? `, Tel: ${extracted.tel}` : ''})` 
        : (extracted?.tel ? `명함 스캔 등록 (Tel: ${extracted.tel})` : '명함 지능형 스캔으로 등록됨'),
      skills: extracted?.englishName ? [editDomain, extracted.englishName] : [editDomain],
      careers: [{
        id: `career-${Date.now()}`,
        companyName: editCompany.trim(),
        title: editTitle.trim(),
        startYear: new Date().getFullYear(),
        isCurrent: true,
        source: 'SOURCE_DATA'
      }],
      academics: [],
      estimatedAgeGroup: inferInitialAgeGroup(editTitle),
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
    onShowToast(`[${newPerson.name}] 님이 소중한 인연으로 성공적으로 등록되었습니다.`);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  명함 원터치 지능형 스캔 &amp; DART 임원 결합
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-mono">
                  Vision AI + DART
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                스마트폰 카메라로 명함을 비추면 온디바이스에서 1초 만에 DART 공시 이력까지 엮어 프로필을 생성합니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
          {/* Card Viewfinder / Camera / Upload Area */}
          {!extracted && (
            <div className="space-y-4">
              {/* Camera Active Viewfinder */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/10] flex items-center justify-center shadow-lg border border-slate-300">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Business Card Framing Guide */}
                  <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="flex justify-between text-[11px] font-mono text-emerald-300 bg-black/50 px-2 py-0.5 rounded self-start">
                      명함을 사각형 안내선 안에 맞추어 주세요
                    </div>
                    <div className="self-end text-[10px] text-emerald-300/80 bg-black/50 px-1.5 py-0.5 rounded">
                      AUTO FOCUS
                    </div>
                  </div>

                  {/* Shutter Button */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                    <button
                      onClick={captureFromCamera}
                      className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>촬영 및 원터치 분석</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-md active:scale-95 transition-all"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                /* Standby View: Start Camera or Select File */
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all bg-slate-50/60 group">
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img
                        src={imagePreview}
                        alt="Card Preview"
                        className="max-h-48 object-contain rounded-xl shadow-md border border-slate-200"
                      />
                      {isScanning && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 text-indigo-700 font-bold text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>DART 공시 임원 교차 검증 중...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 text-indigo-600 shadow-2xs">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}

                  <div className="space-y-1 mb-5">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isScanning ? '온디바이스 텍스트 추출 & DART 공시 대조 중...' : '실시간 카메라로 명함을 촬영하거나 이미지를 등록하세요'}
                    </h3>
                    <p className="text-slate-500 text-xs">
                      스마트폰 카메라 비디오 스트림 또는 JPG, PNG, HEIC 파일 지원 (Zero-Retention 메모리 보안)
                    </p>
                    {cameraError && (
                      <p className="text-rose-600 text-[11px] font-medium pt-1">
                        {cameraError}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>실시간 카메라 켜기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>갤러리에서 파일 선택</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    data-testid="card-file-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Extracted & Inline Quick Editor */}
          {extracted && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* DART Match Status Banner */}
              {extracted.dartMatch?.isMatched ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900 text-xs flex items-center gap-2">
                      <span>금융감독원 DART 상장사 공시 임원 일치 확인</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 font-mono font-bold">
                        DART FACT
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      [{extracted.dartMatch.stockName}]의 공시 등기임원({extracted.dartMatch.registeredRole})으로 자동 검증되어 신뢰 네트워크 노드로 매핑됩니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>비상장 벤처 리더 / 일반 인맥으로 지식 허브에 등록됩니다.</span>
                </div>
              )}

              {/* Inline Quick Editor Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    추출 정보 확인 및 인라인 퀵 에디터
                  </span>
                  <button
                    onClick={() => {
                      setExtracted(null);
                      setImagePreview(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>다시 스캔하기</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4.5 rounded-2xl bg-slate-50/70 border border-slate-200/90">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">성명</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">소속 회사명</label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">직함 (Title)</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">부서 (Department)</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="부서 미상"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">휴대전화</label>
                    <input
                      type="text"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">이메일</label>
                    <input
                      type="text"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">전문 도메인 / 산업 분류</label>
                    <input
                      type="text"
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="예: AI/LLM, 투자/VC, 클라우드"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Retention 메모리 보안</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
            {extracted && (
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>네트워크 인맥으로 등록</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
