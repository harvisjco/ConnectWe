import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  CopilotMessage, 
  processCopilotQuery, 
  generateReconnectionMessage 
} from '../../services/relationshipCopilot';
import { 
  Sparkles, X, Send, Bot, 
  Copy, Check, ShieldCheck
} from 'lucide-react';

interface RelationshipCopilotDrawerProps {
  isOpen: boolean;
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const RelationshipCopilotDrawer: React.FC<RelationshipCopilotDrawerProps> = ({
  isOpen,
  people,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `안녕하세요! ConnectWe 인맥 지능 코파일럿입니다. 💡\n\n내 인맥 그래프를 바탕으로 커피챗 대상 추천, 오랜 기간 연락이 닿지 않은 C-Level 지인 탐색, 맞춤 안부 카톡 작성 등을 도와드립니다. 무엇이 궁금하신가요?`,
      timestamp: '지금'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mePerson = people.find(p => p.closeness === 1);
  const meName = mePerson?.name || '나';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // 메시지 전송 핸들러
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr
    };

    const botResponse = processCopilotQuery(query, people, meName);

    setMessages(prev => [...prev, userMsg, botResponse]);
    setInputValue('');
  };

  // 추천 질문 칩 클릭
  const handleQuickChip = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // 안부 메시지 복사
  const handleCopyMessage = (person: Person) => {
    const text = generateReconnectionMessage(person, meName);
    navigator.clipboard.writeText(text);
    setCopiedId(person.id);
    onShowToast(`[${person.name}] 님께 보낼 안부 메시지가 클립보드에 복사되었습니다.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                인맥 지능 코파일럿
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">AI Copilot</span>
              </h2>
              <p className="text-[11px] text-slate-400">자연어 인맥 질의 &amp; 소통 비서</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {msg.sender === 'user' ? (
                  <>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    <span className="text-[11px] font-bold text-slate-300">나</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-bold text-indigo-400">ConnectWe AI</span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.text}

                {/* 매칭된 인맥 카드 칩 리스트 */}
                {msg.matchedPeople && msg.matchedPeople.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-700/60">
                    {msg.matchedPeople.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-750 hover:border-indigo-500/50 transition-all flex items-center justify-between gap-2"
                      >
                        <div 
                          onClick={() => {
                            onSelectPerson(p);
                            onClose();
                          }}
                          className="cursor-pointer min-w-0 flex-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs hover:text-indigo-300 truncate">
                              {p.name}
                            </span>
                            {p.dartInfo && (
                              <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> DART
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {p.currentCompany} · {p.currentTitle}
                          </div>
                          <div className="text-[10px] text-indigo-400">
                            {p.primaryDomain}
                          </div>
                        </div>

                        {/* 안부 메시지 복사 버튼 */}
                        <button
                          onClick={() => handleCopyMessage(p)}
                          title="안부 카톡 메시지 복사"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex-shrink-0"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-900/80 overflow-x-auto flex gap-1.5 text-[11px] scrollbar-none">
          <button
            onClick={() => handleQuickChip('이번 주 가볍게 커피챗하기 좋은 지인 추천해줘')}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors"
          >
            ☕ 커피챗 추천
          </button>
          <button
            onClick={() => handleQuickChip('오랫동안 연락 안 한 C-Level 누구 있어?')}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors"
          >
            ⚠️ 미소통 지인
          </button>
          <button
            onClick={() => handleQuickChip('네이버나 삼성전자 출신 인맥 찾아줘')}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors"
          >
            🏛️ 빅테크 알럼나이
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="인맥 관련 질문을 입력하세요..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
