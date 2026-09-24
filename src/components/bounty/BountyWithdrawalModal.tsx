import React, { useState } from 'react';
import { DollarSign, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface BountyWithdrawalModalProps {
  totalAvailableReward: number;
  onClose: () => void;
  onConfirmWithdrawal: (amount: number, netAmount: number, bankInfo: string) => void;
}

export const BountyWithdrawalModal: React.FC<BountyWithdrawalModalProps> = ({
  totalAvailableReward,
  onClose,
  onConfirmWithdrawal
}) => {
  const [bankName, setBankName] = useState('카카오뱅크');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('나 (ConnectWe 마스터)');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() => totalAvailableReward > 0 ? totalAvailableReward : 50000);
  const [idFront, setIdFront] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 세무 원천징수(3.3%) 계산
  // 소득세법상 인적용역/기타소득 원천징수: 소득세 3% + 지방소득세 0.3% = 3.3%
  const incomeTax = Math.floor(withdrawAmount * 0.03);
  const localIncomeTax = Math.floor(withdrawAmount * 0.003);
  const totalTax = incomeTax + localIncomeTax;
  const netAmount = Math.max(0, withdrawAmount - totalTax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      alert('출금 계좌번호를 입력해주세요.');
      return;
    }
    if (withdrawAmount <= 0 || withdrawAmount > totalAvailableReward) {
      alert('유효한 출금 금액을 입력해주세요.');
      return;
    }
    if (!isAgreed) {
      alert('원천징수 및 세무 신고를 위한 개인정보 처리에 동의해주세요.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      onConfirmWithdrawal(withdrawAmount, netAmount, `${bankName} ${accountNumber} (${accountHolder})`);
      onClose();
    }, 1500);
  };

  const formatMoney = (val: number) => {
    return `${val.toLocaleString()}원`;
  };

  const banks = ['카카오뱅크', '토스뱅크', 'KB국민', '신한은행', '우리은행', '하나은행', 'NH농협', 'IBK기업'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">헤드헌팅 리워드 계좌 출금 신청</h3>
              <p className="text-[11px] text-slate-400">원천징수 3.3% 세무 공제 후 등록 계좌로 익일 입금</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">출금 신청이 정상 접수되었습니다!</h4>
            <p className="text-xs text-slate-300">
              실수령액 <strong className="text-emerald-400 font-mono">{formatMoney(netAmount)}</strong>이(가)<br />
              {bankName} 계좌로 영업일 기준 1일 이내 입금됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* 출금 가능 잔액 카드 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">출금 가능 확정 리워드</span>
                <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                  {formatMoney(totalAvailableReward)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawAmount(totalAvailableReward)}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all"
              >
                전액 출금
              </button>
            </div>

            {/* 출금 신청 금액 입력 */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">출금 요청 금액 (원):</label>
              <input
                type="number"
                min={10000}
                max={totalAvailableReward}
                step={10000}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 입금 계좌 정보 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">은행:</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500 text-xs"
                >
                  {banks.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-300 font-semibold">계좌번호:</label>
                <input
                  type="text"
                  placeholder="'-' 없이 입력"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 예금주 및 주민등록번호 앞자리 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">예금주명:</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">주민번호 앞6자리 (세무):</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="예: 880101"
                  value={idFront}
                  onChange={(e) => setIdFront(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 원천징수 3.3% 자동 계산 명세서 */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>요청 총액</span>
                <span className="text-white font-bold">{formatMoney(withdrawAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>소득세 (3.0%)</span>
                <span className="text-rose-400">-{formatMoney(incomeTax)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>지방소득세 (0.3%)</span>
                <span className="text-rose-400">-{formatMoney(localIncomeTax)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400">실수령 예정액</span>
                <span className="text-emerald-300 text-sm font-extrabold">{formatMoney(netAmount)}</span>
              </div>
            </div>

            {/* 동의 체크박스 */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="taxAgree"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="taxAgree" className="text-[11px] text-slate-400 cursor-pointer">
                소득세법 제127조에 따른 기타소득 원천징수 3.3% 공제 및 지급명세서 국세청 제출에 동의합니다.
              </label>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={totalAvailableReward <= 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>출금 신청하기</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
