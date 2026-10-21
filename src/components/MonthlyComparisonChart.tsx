import React from 'react';
import { Transaction } from '../types/finance';
import { formatBRL, getMonthNameBR } from '../utils/formatters';

interface Props {
  transactions: Transaction[];
  currentMonthKey: string;
}

export const MonthlyComparisonChart: React.FC<Props> = ({ transactions, currentMonthKey }) => {
  // Generate last 6 months keys
  const [currY, currM] = currentMonthKey.split('-').map(Number);
  const monthKeys: string[] = [];

  for (let i = 5; i >= 0; i--) {
    let m = currM - i;
    let y = currY;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const key = `${y}-${String(m).padStart(2, '0')}`;
    monthKeys.push(key);
  }

  const monthlyStats = monthKeys.map(key => {
    const txsInMonth = transactions.filter(t => t.date.startsWith(key) && t.status === 'completed');
    const income = txsInMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txsInMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = income - expense;
    const rate = income > 0 ? (savings / income) * 100 : 0;

    return {
      key,
      label: getMonthNameBR(key).slice(0, 3),
      fullName: getMonthNameBR(key),
      income,
      expense,
      savings,
      rate,
    };
  });

  const maxVal = Math.max(
    ...monthlyStats.map(s => Math.max(s.income, s.expense)),
    2000
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Média Mensal Receitas</span>
          <p className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBRL(monthlyStats.reduce((s, m) => s + m.income, 0) / monthlyStats.length)}
          </p>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Média Mensal Gastos</span>
          <p className="text-base font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {formatBRL(monthlyStats.reduce((s, m) => s + m.expense, 0) / monthlyStats.length)}
          </p>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Superávit Acumulado (6m)</span>
          <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatBRL(monthlyStats.reduce((s, m) => s + m.savings, 0))}
          </p>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Taxa Poupança Média</span>
          <p className="text-base font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {(monthlyStats.reduce((s, m) => s + m.rate, 0) / monthlyStats.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Grouped Bar Graph */}
      <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 pb-8 px-2 border-b border-slate-200 dark:border-slate-800 relative">
        {monthlyStats.map(stat => {
          const incHeight = (stat.income / maxVal) * 100;
          const expHeight = (stat.expense / maxVal) * 100;
          const isCurrent = stat.key === currentMonthKey;

          return (
            <div key={stat.key} className="flex-1 flex flex-col items-center justify-end h-full relative group">
              <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full">
                {/* Income */}
                <div className="w-4 sm:w-6 flex flex-col justify-end items-center h-full">
                  <div
                    style={{ height: `${Math.max(4, incHeight)}%` }}
                    className="w-full bg-emerald-500/90 rounded-t hover:bg-emerald-500 transition-all duration-200"
                  />
                </div>
                {/* Expense */}
                <div className="w-4 sm:w-6 flex flex-col justify-end items-center h-full">
                  <div
                    style={{ height: `${Math.max(4, expHeight)}%` }}
                    className="w-full bg-rose-500/90 rounded-t hover:bg-rose-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Month label */}
              <div className="absolute -bottom-6 flex flex-col items-center">
                <span className={`text-xs font-medium capitalize ${isCurrent ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {stat.label}
                </span>
              </div>

              {/* Hover card */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-20 bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs whitespace-nowrap min-w-[140px]">
                <span className="font-semibold text-slate-200">{stat.fullName}</span>
                <div className="flex justify-between gap-3 mt-1">
                  <span className="text-slate-400">Receitas:</span>
                  <span className="font-mono tabular-nums text-emerald-400">{formatBRL(stat.income)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Despesas:</span>
                  <span className="font-mono tabular-nums text-rose-400">{formatBRL(stat.expense)}</span>
                </div>
                <div className="flex justify-between gap-3 pt-1 mt-1 border-t border-slate-700">
                  <span className="text-slate-400">Líquido:</span>
                  <span className={`font-mono tabular-nums font-semibold ${stat.savings >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatBRL(stat.savings)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>Receitas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-500" />
          <span>Despesas</span>
        </div>
      </div>
    </div>
  );
};
