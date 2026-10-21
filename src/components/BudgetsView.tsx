import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, Edit3, Check, X } from 'lucide-react';
import { Category, Transaction, BudgetGoal } from '../types/finance';
import { formatBRL, getMonthNameBR, parseSafeFloat } from '../utils/formatters';

interface Props {
  categories: Category[];
  transactions: Transaction[];
  budgets: BudgetGoal[];
  selectedMonth: string;
  onUpdateBudget: (categoryId: string, newLimit: number) => void;
}

export const BudgetsView: React.FC<Props> = ({
  categories,
  transactions,
  budgets,
  selectedMonth,
  onUpdateBudget,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const monthExpenses = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'expense' && t.status === 'completed');

  // Map expenses by category
  const expenseByCat = new Map<string, number>();
  monthExpenses.forEach(t => {
    expenseByCat.set(t.categoryId, (expenseByCat.get(t.categoryId) || 0) + t.amount);
  });

  const budgetMap = new Map(budgets.map(b => [b.categoryId, b.monthlyLimit]));

  const categoryBudgetStatus = expenseCategories.map(cat => {
    const limit = budgetMap.get(cat.id) || cat.monthlyBudget || 0;
    const spent = expenseByCat.get(cat.id) || 0;
    const remaining = limit - spent;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      category: cat,
      limit,
      spent,
      remaining,
      percent,
      isOver: spent > limit && limit > 0,
      isWarning: percent >= 75 && percent <= 100,
    };
  });

  const totalBudgeted = categoryBudgetStatus.reduce((s, c) => s + c.limit, 0);
  const totalSpent = categoryBudgetStatus.reduce((s, c) => s + c.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const handleStartEdit = (catId: string, currentLimit: number) => {
    setEditingCatId(catId);
    setLimitInput(currentLimit.toString());
  };

  const handleSaveBudget = (catId: string) => {
    const num = parseSafeFloat(limitInput);
    onUpdateBudget(catId, num);
    setEditingCatId(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Metas de Gastos & Orçamento
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Defina limites por categoria para manter suas despesas sob controle em {getMonthNameBR(selectedMonth)}
        </p>
      </div>

      {/* Global Budget Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Orçamento Consolidado do Mês
            </h3>
            <p className="text-xs text-slate-500">Total estipulado para todas as categorias</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Gasto: <strong className="text-slate-900 dark:text-white">{formatBRL(totalSpent)}</strong> de {formatBRL(totalBudgeted)}
            </span>
            <span className="block text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {overallPercent.toFixed(1)}% utilizado
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1">
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                overallPercent > 100
                  ? 'bg-rose-500'
                  : overallPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Disponível para gastar: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatBRL(Math.max(0, totalRemaining))}</strong></span>
            {totalRemaining < 0 && (
              <span className="text-rose-500 font-semibold font-mono">Excedido em {formatBRL(Math.abs(totalRemaining))}</span>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryBudgetStatus.map(item => {
          const isEditing = editingCatId === item.category.id;

          return (
            <div
              key={item.category.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.category.color }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.category.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Gasto: {formatBRL(item.spent)}
                    </span>
                  </div>
                </div>

                {/* Edit Budget Button or Form */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      autoFocus
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      className="w-24 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 font-mono"
                    />
                    <button
                      onClick={() => handleSaveBudget(item.category.id)}
                      className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCatId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(item.category.id, item.limit)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <span className="font-mono tabular-nums">Limite: {formatBRL(item.limit)}</span>
                    <Edit3 className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      item.isOver
                        ? 'bg-rose-500'
                        : item.isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, item.percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="font-mono tabular-nums">
                    {item.percent.toFixed(0)}% consumido
                  </span>
                  <span className={`font-mono tabular-nums font-medium ${item.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {item.isOver ? `Estourou ${formatBRL(Math.abs(item.remaining))}` : `Resta ${formatBRL(item.remaining)}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
