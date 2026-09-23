import React, { useState, useRef } from 'react';
import { CalendarMeeting, parseICS, generateMockCalendarMeetings, saveMeetingsToStorage } from '../../services/calendarRadarService';
import { Person } from '../../types/network';
import { 
  Calendar, Upload, FileText, CheckCircle2, AlertCircle, 
  Trash2, X, Sparkles, ShieldCheck, Plus, MapPin
} from 'lucide-react';

interface CalendarImportModalProps {
  meetings: CalendarMeeting[];
  people: Person[];
  onUpdateMeetings: (meetings: CalendarMeeting[]) => void;
  onOpenDossier: (person: Person) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const CalendarImportModal: React.FC<CalendarImportModalProps> = ({
  meetings,
  people,
  onUpdateMeetings,
  onOpenDossier,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 직접 추가 폼 상태
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('15:00');
  const [newLocation, setNewLocation] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  // .ics 파일 파싱
  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseICS(text, people);
      if (parsed.length === 0) {
        onShowToast('유효한 캘린더 일정(VEVENT)을 찾을 수 없습니다.');
        return;
      }
      const updated = [...parsed, ...meetings];
      onUpdateMeetings(updated);
      saveMeetingsToStorage(updated);
      onShowToast(`📅 ${parsed.length}건의 일정이 동기화되었습니다.`);
    } catch (e) {
      console.error(e);
      onShowToast('파일 파싱 중 오류가 발생했습니다.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // 모의 캘린더 데이터 생성
  const handleLoadMock = () => {
    const mocks = generateMockCalendarMeetings(people);
    onUpdateMeetings(mocks);
    saveMeetingsToStorage(mocks);
    onShowToast('스마트 샘플 미팅 2건이 레이더에 동기화되었습니다.');
  };

  // 미팅 삭제
  const handleDeleteMeeting = (id: string) => {
    const updated = meetings.filter(m => m.id !== id);
    onUpdateMeetings(updated);
    saveMeetingsToStorage(updated);
    onShowToast('일정이 삭제되었습니다.');
  };

  // 미팅 직접 추가
  const handleAddDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('회의명을 입력해주세요.');
      return;
    }

    const matched = people.find(p => p.id === selectedPersonId);
    const startIso = `${newDate}T${newTime}:00`;
    const newMeeting: CalendarMeeting = {
      id: `custom-meeting-${Date.now()}`,
      title: newTitle.trim(),
      startTime: startIso,
      endTime: `${newDate}T${parseInt(newTime.slice(0, 2)) + 1}:00:00`,
      location: newLocation.trim() || undefined,
      attendees: matched ? [matched.name, matched.email || ''] : [],
      matchedPerson: matched,
      minutesUntil: Math.round((new Date(startIso).getTime() - Date.now()) / 60000)
    };

    const updated = [newMeeting, ...meetings];
    onUpdateMeetings(updated);
    saveMeetingsToStorage(updated);
    onShowToast(`[${newMeeting.title}] 미팅이 등록되었습니다.`);
    setActiveTab('list');
    setNewTitle('');
    setNewLocation('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                캘린더 연동 &amp; 실시간 미팅 레이더
              </h2>
              <p className="text-[11px] text-slate-400">
                iCal(.ics) 일정 연동 · 인맥 스마트 매칭 · 미팅 10분 전 1-Page AI 브리핑
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadMock}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-900 text-xs font-medium transition-all"
              title="데모 미팅 일정 불러오기"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>데모 일정 연동</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>연동된 미팅 ({meetings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>미팅 직접 등록</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {activeTab === 'list' && (
            <>
              {/* iCal Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-400 bg-indigo-950/40' 
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
                }`}
              >
                <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                <span className="text-xs font-bold text-white mb-0.5">
                  iCal (.ics) 파일 드래그 앤 드롭 또는 클릭하여 업로드
                </span>
                <p className="text-[11px] text-slate-400">
                  Google Calendar, Apple Calendar, Outlook에서 내보낸 .ics 지원
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics,text/calendar"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="hidden"
                />
              </div>

              {/* Meetings List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>동기화된 미팅 목록</span>
                  <span>{meetings.length}건</span>
                </div>

                {meetings.length === 0 ? (
                  <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-950/30 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-slate-400">등록된 미팅 일정이 없습니다.</p>
                    <p className="text-slate-500 text-[11px]">
                      상단의 [데모 일정 연동] 버튼을 누르거나 .ics 파일을 추가해보세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meetings.map((meeting) => {
                      const startTimeDisplay = meeting.startTime.includes('T')
                        ? meeting.startTime.split('T')[1].slice(0, 5)
                        : meeting.startTime;
                      const dateDisplay = meeting.startTime.includes('T')
                        ? meeting.startTime.split('T')[0]
                        : '오늘';

                      return (
                        <div
                          key={meeting.id}
                          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-indigo-400 font-bold">
                                {dateDisplay} {startTimeDisplay}
                              </span>
                              <span className="text-white font-semibold truncate">
                                {meeting.title}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                              {meeting.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {meeting.location}
                                </span>
                              )}
                              {meeting.matchedPerson ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  인맥 매칭: {meeting.matchedPerson.name} ({meeting.matchedPerson.currentCompany})
                                  {meeting.matchedPerson.sourceType === 'DART_FACT' && (
                                    <ShieldCheck className="w-3 h-3 text-emerald-300 ml-0.5" />
                                  )}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <AlertCircle className="w-3 h-3" />
                                  참석자 인맥 자동 매칭 대기 중
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {meeting.matchedPerson && (
                              <button
                                onClick={() => {
                                  onOpenDossier(meeting.matchedPerson!);
                                  onClose();
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold transition-all text-xs shadow-md shadow-indigo-600/20"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>AI 브리핑 리포트</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
                              title="일정 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddDirect} className="space-y-4 max-w-lg mx-auto">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">회의 제목 *</label>
                <input
                  type="text"
                  placeholder="예: 카카오 김도현 상무 전략 협력 미팅"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">일자</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">시간</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs">장소 / 링크</label>
                <input
                  type="text"
                  placeholder="예: 테헤란로 본사 또는 Zoom 링크"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs">미팅 상대 인맥 선택</label>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="">-- 미팅 상대를 선택하세요 (선택 시 AI 브리핑 자동 연결) --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currentCompany} · {p.currentTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>일정 등록</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
