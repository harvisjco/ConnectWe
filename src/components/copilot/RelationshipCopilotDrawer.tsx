import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  CopilotMessage, 
  processCopilotQuery, 
  generateReconnectionMessage 
} from '../../services/relationshipCopilot';
import { 
  Sparkles, Send, Bot, 
  Copy, Check
} from 'lucide-react';
import { DrawerShell, Badge } from '../ui';

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
      text: `안녕하세요! ConnectWe 인맥 지능 코파일럿입니다.\n\n내 인맥 그래프를 바탕으로 커피챗 대상 추천, 오랜 기간 연락이 닿지 않은 C-Level 지인 탐색, 맞춤 안부 카톡 작성 등을 도와드립니다. 무엇이 궁금하신가요?`,
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

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [messages, isOpen, onClose]);

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
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="인맥 지능 코파일럿"
      subtitle="자연어 인맥 질의 & 소통 비서"
      badge={<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">AI Copilot</span>}
      icon={<Sparkles className="w-4 h-4 text-slate-700" />}
      footer={
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
            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-all shadow-sm shadow-slate-900/10 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 cursor-pointer"
            title="전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      }
    >
      {/* Chat Messages Body */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span className="text-[11px] text-slate-400 font-mono">{msg.timestamp}</span>
                  <span className="text-[11px] font-bold text-slate-600">나</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-slate-700" />
                  <span className="text-[11px] font-bold text-slate-800">ConnectWe AI</span>
                  <span className="text-[11px] text-slate-400 font-mono">{msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none whitespace-pre-wrap shadow-sm'
              }`}
            >
              {msg.text}

              {/* 매칭된 인맥 카드 칩 리스트 */}
              {msg.matchedPeople && msg.matchedPeople.length > 0 && (
                <div className="mt-3 space-y-2 pt-2 border-t border-slate-200">
                  {msg.matchedPeople.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 shadow-sm transition-all flex items-center justify-between gap-2"
                    >
                      <div 
                        onClick={() => {
                          onSelectPerson(p);
                          onClose();
                        }}
                        className="cursor-pointer min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs hover:text-indigo-600 truncate">
                            {p.name}
                          </span>
                          {p.dartInfo && (
                            <Badge variant="dart" className="text-[11px]">DART</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                          {p.currentCompany} · {p.currentTitle}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium">
                          {p.primaryDomain}
                        </div>
                      </div>

                      {/* 안부 메시지 복사 버튼 */}
                      <button
                        onClick={() => handleCopyMessage(p)}
                        title="안부 카톡 메시지 복사"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors flex-shrink-0 min-h-[34px] min-w-[34px] flex items-center justify-center active:scale-95"
                      >
                        {copiedId === p.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
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
      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
        <button
          onClick={() => handleQuickChip('이번 주 가볍게 커피챗하기 좋은 지인 추천해줘')}
          className="px-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors font-medium min-h-[32px] cursor-pointer"
        >
          커피챗 추천
        </button>
        <button
          onClick={() => handleQuickChip('오랫동안 연락 안 한 C-Level 누구 있어?')}
          className="px-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors font-medium min-h-[32px] cursor-pointer"
        >
          미소통 지인
        </button>
        <button
          onClick={() => handleQuickChip('네이버나 삼성전자 출신 인맥 찾아줘')}
          className="px-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors font-medium min-h-[32px] cursor-pointer"
        >
          빅테크 알럼나이
        </button>
      </div>
    </DrawerShell>
  );
};
