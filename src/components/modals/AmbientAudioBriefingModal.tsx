import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Headphones, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Radio, 
  Clock 
} from 'lucide-react';
import { Person } from '../../types/network';
import { 
  generateAudioBriefingScript, 
  playBriefingSpeech, 
  stopBriefingSpeech, 
  isSpeechSynthesisSupported 
} from '../../services/ambientAudioBriefingService';

interface AmbientAudioBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AmbientAudioBriefingModal: React.FC<AmbientAudioBriefingModalProps> = ({
  isOpen,
  onClose,
  person,
  onShowToast
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const script = useMemo(() => {
    if (!person) return null;
    return generateAudioBriefingScript(person);
  }, [person]);

  const isTtsSupported = isSpeechSynthesisSupported();

  // 모달 닫힐 때 음성 정지 방어
  useEffect(() => {
    return () => {
      stopBriefingSpeech();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopBriefingSpeech();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen || !person || !script) return null;

  // 음성 재생 토글
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopBriefingSpeech();
      setIsPlaying(false);
    } else {
      if (!isTtsSupported) {
        onShowToast('현재 브라우저 환경에서는 음성 합성을 지원하지 않아 텍스트 브리핑으로 표시합니다.', 'info');
        return;
      }

      setIsPlaying(true);
      playBriefingSpeech(script.fullText, {
        rate: playbackRate,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false);
          setActiveSegmentIndex(0);
        },
        onError: () => {
          setIsPlaying(false);
        }
      });
    }
  };

  // 배속 변경 시 재생 중이면 재시작
  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlaying) {
      stopBriefingSpeech();
      playBriefingSpeech(script.fullText, {
        rate: newRate,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false);
          setActiveSegmentIndex(0);
        },
        onError: () => setIsPlaying(false)
      });
    }
  };

  // 스크립트 복사
  const handleCopyScript = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(script.fullText).catch(() => {});
      }
    } catch {
      // fallback
    }
    setIsCopied(true);
    onShowToast('30초 오디오 브리핑 스크립트가 클립보드에 복사되었습니다.', 'success');
    setTimeout(() => setIsCopied(false), 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Headphones className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  에어팟 앰비언트 30초 오디오 브리핑
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800">
                  라디오 팟캐스트 모드
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {person.name} {person.currentTitle} ({person.currentCompany})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 미니멀 오디오 플레이어 카드 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
            {/* 배경 은은한 빛 */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span>{isPlaying ? '미팅 사전 브리핑 재생 중...' : '30초 온디바이스 음성 대기 중'}</span>
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>예상 30초</span>
                </span>
              </div>

              {/* 웨이브폼 시각화 */}
              <div className="h-10 flex items-center justify-center gap-1">
                {[4, 8, 12, 16, 24, 20, 28, 14, 22, 10, 18, 6, 14, 26, 18, 12, 8, 4].map((h, i) => (
                  <div 
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlaying 
                        ? 'bg-indigo-400 animate-pulse' 
                        : 'bg-slate-700'
                    }`}
                    style={{ 
                      height: isPlaying ? `${Math.max(6, (h * ((i % 3) + 1)) % 32)}px` : `${Math.max(4, h / 3)}px` 
                    }}
                  />
                ))}
              </div>

              {/* 플레이어 조작 바 */}
              <div className="flex items-center justify-between pt-1">
                {/* 배속 선택 */}
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 text-xs">
                  {[1.0, 1.25, 1.5].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleRateChange(rate)}
                      className={`py-1 px-2 rounded-lg font-mono transition-all ${
                        playbackRate === rate 
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* 중앙 메인 재생/정지 버튼 */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-12 h-12 rounded-full bg-white text-slate-900 hover:bg-slate-100 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                  title={isPlaying ? '일시 정지' : '음성 브리핑 재생'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-slate-900" />
                  ) : (
                    <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                  )}
                </button>

                {/* 리셋 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    stopBriefingSpeech();
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="브리핑 정지 및 리셋"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3단계 타임라인 텍스트 스크립트 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>3단계 라디오 브리핑 타임라인</span>
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? '복사됨' : '스크립트 전문 복사'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {script.segments.map((seg, idx) => (
                <div 
                  key={seg.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-1 ${
                    isPlaying && activeSegmentIndex === idx 
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{seg.categoryLabel}</span>
                    <span className="font-mono bg-slate-200/70 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-[10px]">
                      {seg.durationLabel}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            🎧 차량 이동 또는 에어팟 착용 시 최적화된 온디바이스 음성 엔진입니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
