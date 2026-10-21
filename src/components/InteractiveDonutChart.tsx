import React, { useState } from 'react';
import { Category, Transaction } from '../types/finance';
import { formatBRL } from '../utils/formatters';

interface DonutSlice {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onSelectCategory?: (categoryId: string | null) => void;
  selectedCategoryId?: string | null;
}

export const InteractiveDonutChart: React.FC<Props> = ({
  transactions,
  categories,
  onSelectCategory,
  selectedCategoryId,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter only completed expenses
  const expenses = transactions.filter(t => t.type === 'expense' && t.status === 'completed');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const expenseByCat = new Map<string, number>();

  expenses.forEach(t => {
    expenseByCat.set(t.categoryId, (expenseByCat.get(t.categoryId) || 0) + t.amount);
  });

  const slices: DonutSlice[] = [];
  let currentAngle = 0;

  // Sort descending by amount
  const sortedEntries = Array.from(expenseByCat.entries()).sort((a, b) => b[1] - a[1]);

  sortedEntries.forEach(([catId, amount]) => {
    const cat = categoryMap.get(catId);
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    const sliceAngle = (percentage / 100) * 360;

    slices.push({
      categoryId: catId,
      categoryName: cat?.name || 'Outros',
      color: cat?.color || '#64748B',
      amount,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
    });

    currentAngle += sliceAngle;
  });

  const activeId = hoveredId || selectedCategoryId;
  const activeSlice = slices.find(s => s.categoryId === activeId);

  // SVG parameters
  const size = 260;
  const center = size / 2;
  const radius = 100;
  const innerRadius = 66;

  function polarToCartesian(centerX: number, centerY: number, rad: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  }

  function describeArc(x: number, y: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
    const sweep = endAngle - startAngle;
    const effectiveEnd = sweep >= 359.99 ? startAngle + 359.99 : endAngle;

    const startOuter = polarToCartesian(x, y, rOuter, effectiveEnd);
    const endOuter = polarToCartesian(x, y, rOuter, startAngle);
    const startInner = polarToCartesian(x, y, rInner, startAngle);
    const endInner = polarToCartesian(x, y, rInner, effectiveEnd);

    const largeArcFlag = sweep <= 180 ? '0' : '1';

    return [
      'M', startOuter.x, startOuter.y,
      'A', rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', startInner.x, startInner.y,
      'A', rInner, rInner, 0, largeArcFlag, 1, endInner.x, endInner.y,
      'Z',
    ].join(' ');
  }

  if (totalExpense === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        <p className="text-sm font-medium">Nenhuma despesa registrada neste período</p>
        <span className="text-xs mt-1">Adicione ou escaneie novos itens para ver o gráfico</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0">
        <svg
          width={size}
          height={size}
          className="overflow-visible focus:outline-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {slices.map(slice => {
            const isHovered = activeId === slice.categoryId;
            const currentOuter = isHovered ? radius + 6 : radius;
            const currentInner = isHovered ? innerRadius - 2 : innerRadius;

            return (
              <path
                key={slice.categoryId}
                d={describeArc(center, center, currentOuter, currentInner, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                className="cursor-pointer transition-all duration-200 hover:opacity-95"
                onMouseEnter={() => setHoveredId(slice.categoryId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(selectedCategoryId === slice.categoryId ? null : slice.categoryId);
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[130px]">
            {activeSlice ? activeSlice.categoryName : 'Total Despesas'}
          </span>
          <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
            {formatBRL(activeSlice ? activeSlice.amount : totalExpense)}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {activeSlice ? `${activeSlice.percentage.toFixed(1)}% do total` : `${expenses.length} lançamentos`}
          </span>
        </div>
      </div>

      {/* Category breakdown legend */}
      <div className="flex-1 w-full space-y-2 max-h-64 overflow-y-auto pr-1">
        {slices.map(slice => {
          const isSelected = selectedCategoryId === slice.categoryId;
          const isHovered = activeId === slice.categoryId;

          return (
            <button
              type="button"
              key={slice.categoryId}
              onClick={() => onSelectCategory?.(isSelected ? null : slice.categoryId)}
              onMouseEnter={() => setHoveredId(slice.categoryId)}
              onMouseLeave={() => setHoveredId(null)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-700'
                  : isHovered
                  ? 'bg-slate-50 dark:bg-slate-800/60'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {slice.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {slice.percentage.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatBRL(slice.amount)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
