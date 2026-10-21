import React, { useState } from 'react';
import { Transaction } from '../types/finance';
import { formatBRL } from '../utils/formatters';

interface Props {
  transactions: Transaction[];
  monthKey: string; // YYYY-MM
}

export const CashFlowBarChart: React.FC<Props> = ({ transactions, monthKey }) => {
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    income: number;
    expense: number;
    net: number;
  } | null>(null);

  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyData: { day: number; income: number; expense: number; net: number }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    dailyData.push({ day: d, income: 0, expense: 0, net: 0 });
  }

  transactions.forEach(t => {
    if (t.status !== 'completed') return;
    if (!t.date.startsWith(monthKey)) return;

    const dayNum = parseInt(t.date.split('-')[2], 10);
    if (dayNum >= 1 && dayNum <= daysInMonth) {
      if (t.type === 'income') {
        dailyData[dayNum - 1].income += t.amount;
      } else if (t.type === 'expense') {
        dailyData[dayNum - 1].expense += t.amount;
      }
    }
  });

  dailyData.forEach(d => {
    d.net = d.income - d.expense;
  });

  const maxVal = Math.max(
    ...dailyData.map(d => Math.max(d.income, d.expense)),
    100
  );

  const totalIncome = dailyData.reduce((acc, cur) => acc + cur.income, 0);
  const totalExpense = dailyData.reduce((acc, cur) => acc + cur.expense, 0);
  const totalNet = totalIncome - totalExpense;

  return (
    <div className="space-y-4">
      {/* Top summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Receitas</span>
            <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatBRL(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400">Despesas</span>
            <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatBRL(totalExpense)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <span className="text-slate-500 text-[11px]">Resultado Líquido:</span>
          <span className={`font-bold ${totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {totalNet >= 0 ? `+${formatBRL(totalNet)}` : formatBRL(totalNet)}
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-48 w-full flex items-end gap-1 pt-6 pb-6 px-1 border-b border-slate-200 dark:border-slate-800">
        {/* Subtle grid lines */}
        <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-200 dark:border-slate-800/80 pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200 dark:border-slate-800/80 pointer-events-none" />

        {dailyData.map(item => {
          const incHeight = (item.income / maxVal) * 100;
          const expHeight = (item.expense / maxVal) * 100;

          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer"
              onMouseEnter={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Bars cluster */}
              <div className="w-full flex items-end justify-center gap-0.5 h-full">
                {/* Income bar */}
                <div
                  style={{ height: `${Math.min(100, Math.max(item.income > 0 ? 4 : 0, incHeight))}%` }}
                  className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-sm transition-all duration-200 group-hover:bg-emerald-400"
                />
                {/* Expense bar */}
                <div
                  style={{ height: `${Math.min(100, Math.max(item.expense > 0 ? 4 : 0, expHeight))}%` }}
                  className="w-1.5 sm:w-2 bg-rose-500 rounded-t-sm transition-all duration-200 group-hover:bg-rose-400"
                />
              </div>

              {/* Day label every 5 days or 1st/last */}
              {(item.day === 1 || item.day % 5 === 0 || item.day === daysInMonth) && (
                <span className="absolute -bottom-5 text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                  {item.day}
                </span>
              )}
            </div>
          );
        })}

        {/* Hover Tooltip */}
        {hoveredDay && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-3">
            <span className="font-semibold text-slate-200">Dia {hoveredDay.day}</span>
            <span className="text-emerald-400 font-mono tabular-nums">+{formatBRL(hoveredDay.income)}</span>
            <span className="text-rose-400 font-mono tabular-nums">-{formatBRL(hoveredDay.expense)}</span>
            <span className={`font-mono tabular-nums font-bold ${hoveredDay.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              Sal: {formatBRL(hoveredDay.net)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
        <span>Dias do Mês</span>
        <span>Escala máx: {formatBRL(maxVal)}/dia</span>
      </div>
    </div>
  );
};
