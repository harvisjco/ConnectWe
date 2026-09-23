import React, { useState } from 'react';
import { Person, GraphQueryResult } from './types/network';
import { INITIAL_PEOPLE_SEED } from './data/mockNetworkData';
import { executeGraphRagQuery } from './services/graphRagEngine';
import { resolveAndMergePeople } from './services/entityResolver';

import { Header } from './components/common/Header';
import { GraphSearchBar } from './components/search/GraphSearchBar';
import { CompanyAlumniView } from './components/views/CompanyAlumniView';
import { AgeSpectrumView } from './components/views/AgeSpectrumView';
import { NetworkCanvasView } from './components/views/NetworkCanvasView';
import { PersonInspectorDrawer } from './components/inspector/PersonInspectorDrawer';
import { ImportDataModal } from './components/import/ImportDataModal';

import { Building2, Calendar, Share2, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE_SEED);
  const [activeView, setActiveView] = useState<'company' | 'age' | 'canvas'>('company');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Search & GraphRAG State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<GraphQueryResult | null>(null);

  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast 헬퍼
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // GraphRAG 질의 실행
  const handleExecuteSearch = (q: string) => {
    const res = executeGraphRagQuery(q, people);
    setSearchResult(res);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  // 신규 데이터 수집 및 병합(Entity Resolution)
  const handleImportSuccess = (incoming: Person[]) => {
    const merged = resolveAndMergePeople(people, incoming);
    setPeople(merged);
    showToast(`성공적으로 ${incoming.length}명의 인맥 노드가 지식 허브에 병합되었습니다.`);
  };

  // 메모 업데이트
  const handleUpdateMemo = (personId: string, newMemo: string) => {
    setPeople(prev => prev.map(p => p.id === personId ? { ...p, memo: newMemo } : p));
    if (selectedPerson && selectedPerson.id === personId) {
      setSelectedPerson(prev => prev ? { ...prev, memo: newMemo } : null);
    }
    showToast('인맥 메모가 안전하게 업데이트되었습니다.');
  };

  // 현재 표출 대상 인물 (검색 결과가 있으면 필터링된 인맥, 없으면 전체 인맥)
  const displayPeople = searchResult ? searchResult.matchedPeople : people;
  const highlightNodeIds = searchResult ? searchResult.highlightNodeIds : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        people={people}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onSelectPerson={setSelectedPerson}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* GraphRAG Search Interface */}
        <section>
          <GraphSearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onExecuteSearch={handleExecuteSearch}
            onResetSearch={handleResetSearch}
            searchResult={searchResult}
          />
        </section>

        {/* View Mode Switcher Navigation Tabs */}
        <section className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveView('company')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'company'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏢 회사별 & 알럼나이 뷰</span>
            </button>

            <button
              onClick={() => setActiveView('age')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'age'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>🎂 나이대별 스펙트럼 뷰</span>
            </button>

            <button
              onClick={() => setActiveView('canvas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>🕸️ 지식 그래프 캔버스</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            {displayPeople.length === people.length ? (
              <span>전체 <strong className="text-white">{people.length}명</strong>의 인맥 탐색 중</span>
            ) : (
              <span>검색 필터링 결과 <strong className="text-indigo-400">{displayPeople.length}명</strong> 표출 중</span>
            )}
          </div>
        </section>

        {/* Dynamic Multi-dimensional Views */}
        <section className="animate-in fade-in duration-200">
          {activeView === 'company' && (
            <CompanyAlumniView
              people={displayPeople}
              onSelectPerson={setSelectedPerson}
            />
          )}

          {activeView === 'age' && (
            <AgeSpectrumView
              people={displayPeople}
              onSelectPerson={setSelectedPerson}
            />
          )}

          {activeView === 'canvas' && (
            <NetworkCanvasView
              people={displayPeople}
              highlightNodeIds={highlightNodeIds}
              onSelectPerson={setSelectedPerson}
            />
          )}
        </section>

      </main>

      {/* Apple-styled Deep Inspector Drawer */}
      <PersonInspectorDrawer
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onUpdatePersonMemo={handleUpdateMemo}
      />

      {/* Multi-source Ingestion Modal */}
      {isImportModalOpen && (
        <ImportDataModal
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl shadow-indigo-500/40 border border-indigo-400/30 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
