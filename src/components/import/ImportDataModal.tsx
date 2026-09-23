import React, { useState } from 'react';
import { Person } from '../../types/network';
import { parseRememberCsv } from '../../services/rememberParser';
import { parseVCard } from '../../services/vcardParser';
import { parseRawBusinessCardText } from '../../services/cardOcrEngine';
import { 
  X, UploadCloud, Smartphone, FileSpreadsheet, Camera, 
  CheckCircle2, ArrowRight, Sparkles, RefreshCw
} from 'lucide-react';

interface ImportDataModalProps {
  onClose: () => void;
  onImportSuccess: (importedPeople: Person[]) => void;
}

// 1. 리멤버 샘플 CSV 데이터 (BOM 포함 시뮬레이션)
const SAMPLE_REMEMBER_CSV = `\uFEFF이름,회사,부서,직책,이메일,휴대폰,유선전화,주소,메모
이진우,카카오엔터프라이즈,클라우드아키텍처팀,상무 / 클라우드수석,jw.lee@kakaoenterprise.com,010-9182-3847,02-500-1122,경기도 성남시 분당구 판교역로,네트워킹 세미나 명함 교환
박세희,크래프톤,AI R&D Center,팀장 / 리드사이언티스트,sh.park@krafton.com,010-8273-1928,031-698-3300,서울특별시 강남구 테헤란로,생성형 AI NPC 프로젝트 협업 논의
정민규,에이아이세미컨덕터,SOC설계본부,수석엔지니어,mg.jung@aisemi.kr,010-4412-9981,,경기도 수원시 영통구,NPU 가속기 IP 라이센싱 미팅
황보미,패스트벤처스,투자본부,수석심사역,bm.hwang@fastventures.co.kr,010-6712-3401,,서울특별시 강남구 역삼로,시리즈 A 투자 라운드 IR 미팅`;

// 2. 스마트폰 vCard (.vcf) 샘플 데이터
const SAMPLE_VCARD_VCF = `BEGIN:VCARD
VERSION:3.0
FN:최선호
ORG:몰로코 (Moloco);머신러닝인프라
TITLE:Engineering Director
TEL;TYPE=CELL:010-7744-1299
EMAIL:sh.choi@moloco.com
BDAY:1984-05-18
NOTE:머신러닝 애드테크 인프라 글로벌 엔지니어링 리드
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:강은지
ORG:당근마켓;로컬커머스
TITLE:프로덕트 리드 (PO)
TEL;TYPE=CELL:010-3301-8842
EMAIL:ej.kang@daangn.com
NOTE:하이퍼로컬 서비스 및 광고 비즈니스 총괄
END:VCARD`;

// 3. 명함 OCR 텍스트 샘플
const SAMPLE_OCR_TEXT = `(주)센드버드 코리아
기술총괄부사장 (VP of Eng)
장원석 (Wonseok Jang)
Mobile: 010-5582-9011 | Tel: 02-345-6789
Email: ws.jang@sendbird.com
서울특별시 강남구 테헤란로 427 위워크타워 14층
https://sendbird.com`;

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  onClose,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'remember' | 'vcard' | 'ocr'>('remember');
  const [inputText, setInputText] = useState<string>(SAMPLE_REMEMBER_CSV);
  const [parsedPreview, setParsedPreview] = useState<Person[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 탭 변경 시 기본 샘플 자동 로드
  const handleTabChange = (tab: 'remember' | 'vcard' | 'ocr') => {
    setActiveTab(tab);
    if (tab === 'remember') {
      setInputText(SAMPLE_REMEMBER_CSV);
    } else if (tab === 'vcard') {
      setInputText(SAMPLE_VCARD_VCF);
    } else {
      setInputText(SAMPLE_OCR_TEXT);
    }
    setParsedPreview([]);
  };

  // 실시간 파싱 실행
  const handleParse = () => {
    setIsProcessing(true);
    setTimeout(() => {
      let results: Person[] = [];
      if (activeTab === 'remember') {
        results = parseRememberCsv(inputText);
      } else if (activeTab === 'vcard') {
        results = parseVCard(inputText);
      } else {
        const single = parseRawBusinessCardText(inputText);
        if (single.name) {
          results = [single as Person];
        }
      }
      setParsedPreview(results);
      setIsProcessing(false);
    }, 250);
  };

  // 파일 업로드 (드래그 앤 드롭 또는 파일 선택)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file, 'utf-8');
  };

  // 최종 지식 그래프 및 주소록에 병합 적용
  const handleApplyToGraph = () => {
    if (parsedPreview.length === 0) return;
    onImportSuccess(parsedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">다채널 주소록 & 명함 데이터 수집</h2>
              <p className="text-xs text-slate-400">
                리멤버 CSV, 스마트폰 vCard, 명함 OCR을 자동 구조화하여 지식 그래프로 통합합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Way Mode Switcher Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => handleTabChange('remember')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'remember'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>리멤버 엑셀/CSV 파서</span>
          </button>

          <button
            onClick={() => handleTabChange('vcard')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'vcard'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>스마트폰 주소록 (.vcf)</span>
          </button>

          <button
            onClick={() => handleTabChange('ocr')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'ocr'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>실시간 명함 OCR 스캔</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* File Upload or Textarea Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                {activeTab === 'remember' && '리멤버 내보내기 CSV 텍스트 또는 파일:'}
                {activeTab === 'vcard' && '스마트폰 vCard (.vcf) 데이터 또는 파일:'}
                {activeTab === 'ocr' && '명함 텍스트 또는 OCR 추출 결과:'}
              </span>

              <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>내 PC 파일 선택</span>
                <input
                  type="file"
                  accept={activeTab === 'remember' ? '.csv,.txt' : activeTab === 'vcard' ? '.vcf,.txt' : '.txt,.jpg,.png'}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="파일 내용을 붙여넣거나 위의 샘플을 확인하세요..."
            />
          </div>

          {/* Parse Button */}
          <div className="flex justify-end">
            <button
              onClick={handleParse}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
            >
              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
              <span>구조화 파싱 & 미리보기</span>
            </button>
          </div>

          {/* Parsed Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  파싱 완료: {parsedPreview.length}명의 인맥 노드 추출됨
                </span>
                <span className="text-[11px] text-slate-400">
                  동일인 자동 해소(Entity Resolution) 준비 완료
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2.5">이름</th>
                      <th className="p-2.5">회사</th>
                      <th className="p-2.5">직책</th>
                      <th className="p-2.5">연락처</th>
                      <th className="p-2.5">추정나이대</th>
                      <th className="p-2.5">도메인</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedPreview.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-bold text-white">{p.name}</td>
                        <td className="p-2.5 text-slate-300">{p.currentCompany}</td>
                        <td className="p-2.5 text-slate-400">{p.currentTitle}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-400">{p.mobile}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300">
                            {p.estimatedAgeGroup}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">{p.primaryDomain}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            취소
          </button>

          <button
            onClick={handleApplyToGraph}
            disabled={parsedPreview.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <span>인맥 지능 허브에 통합 반영 ({parsedPreview.length}명)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
