import React, { useState, useRef } from 'react';
import { Person } from '../../types/network';
import { Building2, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import { identifyTalentCluster } from '../../services/talentClusterEngine';

interface PersonMiniPreviewTooltipProps {
  person: Person;
  children: React.ReactNode;
  onSelectPerson?: (person: Person) => void;
  isShieldActive?: boolean;
}

export const PersonMiniPreviewTooltip: React.FC<PersonMiniPreviewTooltipProps> = ({
  person,
  children,
  onSelectPerson,
  isShieldActive = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 220); // 220ms Apple-style deliberate hover delay
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const cluster = identifyTalentCluster(person);
  const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
  const recentCareer = person.careers?.find(c => !c.isCurrent);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div 
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 bg-slate-900/95 text-white rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md pointer-events-auto text-left animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">
                  {isShieldActive ? `${person.name[0]}**` : person.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium">
                  {person.closeness}촌
                </span>
                {isDart && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    <ShieldCheck className="w-2.5 h-2.5" /> DART
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                {person.currentCompany} · {person.currentTitle}
              </div>
            </div>

            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${cluster.badgeStyle}`}>
              {cluster.label}
            </span>
          </div>

          {/* Quick Body Details */}
          <div className="py-2 space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{person.currentDepartment || '본사'} · {person.primaryDomain || '전문 영역'}</span>
            </div>

            {recentCareer && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">(전) {recentCareer.companyName} {recentCareer.title}</span>
              </div>
            )}

            {person.skills && person.skills.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                {person.skills.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    #{s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA Footer */}
          {onSelectPerson && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {person.estimatedAgeGroup ? `${person.estimatedAgeGroup.replace('_plus', '+')}대` : '경력'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPerson(person);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <span>프로필 상세</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Triangle Pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};
